  import { Injectable, UnauthorizedException, ConflictException, BadRequestException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto, LoginDto, ChangePasswordDto, ForgotPasswordDto, ResetPasswordDto, VerifyResetCodeDto } from '../dto/auth.dto';
import { EmailService } from '../email/email.service';
import { User, UserRole } from '@prisma/client';
import { getFirebaseAdmin, initializeFirebaseAdmin } from '../config/firebase.config';

type UserWithoutPassword = Omit<User, 'password'>;

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private emailService: EmailService,
  ) {
    // Inicializar Firebase Admin quando o serviço for criado
    initializeFirebaseAdmin();
  }

  async register(registerDto: RegisterDto): Promise<{ user: UserWithoutPassword; token: string }> {
    const { email, password, ...userData } = registerDto;

    // Verificar se o usuário já existe
    const existingUser = await this.prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new ConflictException('Email já está em uso');
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 12);

    // Criar usuário
    const savedUser = await this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: userData.name,
        phone: userData.phone,
        cpf: userData.cpf,
        address: userData.address,
        city: userData.city,
        state: userData.state,
        zipCode: userData.zipCode,
        role: userData.role || UserRole.CUSTOMER,
        storeId: userData.storeId,
        passwordChangedAt: new Date(), // Definir data inicial
      },
      include: {
        store: true,
      },
    });

    // Gerar token
    const token = this.generateToken(savedUser);

    // Remover senha do retorno
    const { password: _, ...userWithoutPassword } = savedUser;

    return {
      user: userWithoutPassword,
      token,
    };
  }

  async login(loginDto: LoginDto): Promise<{ user: UserWithoutPassword; token: string }> {
    const { email, password } = loginDto;

    // Verificar modo de manutenção ANTES de processar login
    const maintenanceMode = await this.getMaintenanceMode();
    if (maintenanceMode) {
      // Buscar usuário para verificar se é admin
      const user = await this.prisma.user.findUnique({ 
        where: { email },
        select: { role: true }
      });
      
      // Bloquear login se não for admin
      if (!user || user.role !== 'ADMIN') {
        throw new UnauthorizedException(
          'O sistema está em modo de manutenção. Apenas administradores podem fazer login no momento. Tente novamente mais tarde.'
        );
      }
    }

    // Buscar usuário
    const user = await this.prisma.user.findUnique({ 
      where: { email },
      include: {
        store: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Email não encontrado');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Usuário inativo');
    }

    // Verificar expiração de senha
    const passwordExpired = await this.checkPasswordExpiration(user);
    if (passwordExpired) {
      throw new UnauthorizedException(
        'Sua senha expirou. Por favor, altere sua senha para continuar.'
      );
    }

    // Verificar tentativas de login antes de verificar senha
    const maxAttempts = await this.getMaxLoginAttempts();
    const loginAttempts = await this.getLoginAttempts(email);
    
    if (loginAttempts >= maxAttempts) {
      throw new UnauthorizedException(
        `Muitas tentativas de login falhadas. Tente novamente em alguns minutos.`
      );
    }

    // Verificar senha
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      // Incrementar tentativas
      await this.incrementLoginAttempts(email);
      
      const remainingAttempts = maxAttempts - loginAttempts - 1;
      throw new UnauthorizedException(
        `Senha incorreta. Tentativas restantes: ${remainingAttempts}`
      );
    }

    // Resetar tentativas em caso de sucesso
    await this.resetLoginAttempts(email);

    // Gerar token
    const token = this.generateToken(user);

    // Remover senha do retorno
    const { password: _, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      token,
    };
  }

  async changePassword(userId: string, changePasswordDto: ChangePasswordDto): Promise<void> {
    const { currentPassword, newPassword } = changePasswordDto;

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('Usuário não encontrado');
    }

    // Verificar senha atual
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException('Senha atual incorreta');
    }

    // Hash da nova senha
    const hashedNewPassword = await bcrypt.hash(newPassword, 12);

    // Atualizar senha e data de alteração
    await this.prisma.user.update({
      where: { id: userId },
      data: { 
        password: hashedNewPassword,
        passwordChangedAt: new Date()
      },
    });
  }

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (user && await bcrypt.compare(password, user.password)) {
      const { password: _, ...result } = user;
      return result as User;
    }
    return null;
  }

  async findUserById(id: string): Promise<User | null> {
    try {
      // Tentar garantir conexão antes de fazer query
      await this.prisma.$connect();
      
      return await this.prisma.user.findUnique({ 
        where: { id },
        include: {
          store: true,
        },
      });
    } catch (error: any) {
      // Em caso de erro de conexão, tentar reconectar e tentar novamente
      if (error.code === 'P1017' || error.message?.includes('Server has closed the connection') || error.message?.includes('db_termination')) {
        try {
          console.warn('Erro de conexão ao buscar usuário, tentando reconectar...');
          await this.prisma.$disconnect();
          await new Promise(resolve => setTimeout(resolve, 1000));
          await this.prisma.$connect();
          
          return await this.prisma.user.findUnique({ 
            where: { id },
            include: {
              store: true,
            },
          });
        } catch (retryError) {
          console.error('Erro ao reconectar:', retryError);
          // Retornar null em vez de lançar erro para evitar quebrar a autenticação
          return null;
        }
      }
      // Re-lançar outros erros
      throw error;
    }
  }

  async checkEmailExists(email: string): Promise<{ exists: boolean }> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    return { exists: !!user };
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<{ message: string; emailExists: boolean }> {
    const { email } = forgotPasswordDto;

    // Normalizar email
    const normalizedEmail = email.toLowerCase().trim();

    // Verificar se o usuário existe
    const user = await this.prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (!user) {
      // Retornar indicando que o email não existe
      return { 
        message: 'Este email não está cadastrado em nossa base de dados. Verifique o email e tente novamente.',
        emailExists: false 
      };
    }

    // Gerar código de 6 dígitos (garantir que seja string com 6 dígitos)
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Garantir que o código tem exatamente 6 dígitos
    if (code.length !== 6) {
      throw new BadRequestException('Erro ao gerar código. Tente novamente.');
    }

    // Expira em 15 minutos
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15);

    // Invalidar códigos anteriores não usados para este email
    await this.prisma.passwordReset.updateMany({
      where: {
        email: normalizedEmail,
        used: false,
      },
      data: {
        used: true,
      },
    });

    // Criar novo código de reset
    await this.prisma.passwordReset.create({
      data: {
        email: normalizedEmail,
        code,
        expiresAt,
        userId: user.id,
      },
    });

    // Enviar email com o código
    await this.emailService.sendPasswordResetCode(normalizedEmail, code);

    return { 
      message: 'Código enviado com sucesso! Verifique seu email.',
      emailExists: true 
    };
  }

  async verifyResetCode(verifyResetCodeDto: VerifyResetCodeDto): Promise<{ valid: boolean; message: string }> {
    const { email, code } = verifyResetCodeDto;

    // Validar formato do código (exatamente 6 dígitos)
    const codeRegex = /^\d{6}$/;
    if (!codeRegex.test(code)) {
      throw new BadRequestException('Código inválido. O código deve ter exatamente 6 dígitos numéricos.');
    }

    // Normalizar email para comparação (lowercase)
    const normalizedEmail = email.toLowerCase().trim();

    // Verificar se o usuário existe
    const user = await this.prisma.user.findUnique({ 
      where: { email: normalizedEmail } 
    });
    if (!user) {
      throw new BadRequestException('Código inválido ou expirado.');
    }

    // Buscar o código de reset
    const passwordReset = await this.prisma.passwordReset.findFirst({
      where: {
        email: normalizedEmail,
        code: code,
        used: false,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!passwordReset) {
      throw new BadRequestException('Código inválido ou expirado.');
    }

    // Verificar se o código expirou
    const now = new Date();
    if (passwordReset.expiresAt < now) {
      await this.prisma.passwordReset.update({
        where: { id: passwordReset.id },
        data: { used: true },
      });
      throw new BadRequestException('Código expirado. Solicite um novo código.');
    }

    // Verificar se o código pertence ao usuário correto
    if (passwordReset.userId && passwordReset.userId !== user.id) {
      throw new BadRequestException('Código inválido para este usuário.');
    }

    return { valid: true, message: 'Código válido' };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<{ message: string }> {
    const { email, code, newPassword } = resetPasswordDto;

    // Validar formato do código (exatamente 6 dígitos)
    const codeRegex = /^\d{6}$/;
    if (!codeRegex.test(code)) {
      throw new BadRequestException('Código inválido. O código deve ter exatamente 6 dígitos numéricos.');
    }

    // Normalizar email para comparação (lowercase)
    const normalizedEmail = email.toLowerCase().trim();

    // PRIMEIRO: Verificar se o email existe no banco ANTES de qualquer validação de código
    const user = await this.prisma.user.findUnique({ 
      where: { email: normalizedEmail } 
    });
    if (!user) {
      // Por segurança, não revelar se o email existe ou não
      throw new BadRequestException('Código inválido ou expirado. Verifique o código recebido por email.');
    }

    // Buscar o código de reset EXATO para este email e código
    // Isso garante que estamos validando o código correto
    const passwordReset = await this.prisma.passwordReset.findFirst({
      where: {
        email: normalizedEmail,
        code: code, // Buscar pelo código EXATO informado
        used: false,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!passwordReset) {
      // Não revelar muito sobre o erro por segurança
      throw new BadRequestException('Código inválido ou expirado. Verifique o código recebido por email.');
    }

    // Verificar se o código expirou
    const now = new Date();
    if (passwordReset.expiresAt < now) {
      await this.prisma.passwordReset.update({
        where: { id: passwordReset.id },
        data: { used: true },
      });
      throw new BadRequestException('Código expirado. Solicite um novo código.');
    }

    // Verificar se o código pertence ao usuário correto (validação extra de segurança)
    if (passwordReset.userId && passwordReset.userId !== user.id) {
      throw new BadRequestException('Código inválido para este usuário.');
    }

    // Hash da nova senha
    const hashedNewPassword = await bcrypt.hash(newPassword, 12);

    // Atualizar senha e marcar código como usado (usando transação para garantir atomicidade)
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: user.id },
        data: { 
          password: hashedNewPassword,
          passwordChangedAt: new Date()
        },
      }),
      this.prisma.passwordReset.update({
        where: { id: passwordReset.id },
        data: { used: true },
      }),
    ]);

    return { message: 'Senha redefinida com sucesso' };
  }

  async loginWithGoogle(idToken: string): Promise<{ user: UserWithoutPassword; token: string }> {
    try {
      // Validar o token do Firebase
      const firebaseAdmin = getFirebaseAdmin();
      if (!firebaseAdmin) {
        throw new UnauthorizedException('Firebase Admin não está configurado');
      }

      const decodedToken = await firebaseAdmin.auth().verifyIdToken(idToken);
      const { email, name, uid, picture, phone_number } = decodedToken;

      if (!email) {
        throw new UnauthorizedException('Email não encontrado no token do Google');
      }

      // Normalizar email
      const normalizedEmail = email.toLowerCase().trim();

      // Verificar se o usuário já existe
      let user = await this.prisma.user.findUnique({
        where: { email: normalizedEmail },
        include: {
          store: true,
        },
      });

      if (user) {
        // Usuário existe, fazer login
        if (!user.isActive) {
          throw new UnauthorizedException('Usuário inativo');
        }

        // Atualizar informações do Google se necessário (avatar, nome, etc)
        const updateData: any = {};
        if (name && !user.name) {
          updateData.name = name;
        }
        if (picture && !user.avatarUrl) {
          updateData.avatarUrl = picture;
        }
        if (phone_number && !user.phone) {
          updateData.phone = phone_number;
        }

        if (Object.keys(updateData).length > 0) {
          user = await this.prisma.user.update({
            where: { id: user.id },
            data: updateData,
            include: {
              store: true,
            },
          });
        }
      } else {
        // Usuário não existe, criar conta
        const userName = name || email.split('@')[0] || 'Usuário';
        
        // Gerar uma senha aleatória que nunca será usada (usuários do Google não precisam de senha)
        // Mas o campo é obrigatório no schema, então geramos uma senha aleatória segura
        const randomPassword = await bcrypt.hash(
          `google_${uid}_${Date.now()}_${Math.random().toString(36)}`,
          12
        );
        
        user = await this.prisma.user.create({
          data: {
            email: normalizedEmail,
            password: randomPassword, // Senha aleatória que nunca será usada
            name: userName,
            phone: phone_number || undefined,
            avatarUrl: picture || undefined,
            role: UserRole.CUSTOMER,
            isActive: true,
          },
          include: {
            store: true,
          },
        });
      }

      // Gerar token JWT
      const token = this.generateToken(user);

      // Remover senha do retorno
      const { password: _, ...userWithoutPassword } = user;

      return {
        user: userWithoutPassword,
        token,
      };
    } catch (error: any) {
      console.error('Erro no login com Google:', error);
      
      if (error.code === 'auth/id-token-expired') {
        throw new UnauthorizedException('Token do Google expirado. Faça login novamente.');
      } else if (error.code === 'auth/argument-error') {
        throw new UnauthorizedException('Token do Google inválido.');
      } else if (error instanceof UnauthorizedException) {
        throw error;
      }
      
      throw new UnauthorizedException('Erro ao autenticar com Google. Tente novamente.');
    }
  }

  private async getMaintenanceMode(): Promise<boolean> {
    try {
      const settings = await this.prisma.systemSettings.findUnique({
        where: { key: 'system_settings' }
      });
      
      if (settings && settings.value) {
        const value = settings.value as any;
        return value?.system?.maintenanceMode || false;
      }
      return false;
    } catch (error) {
      console.error('Erro ao verificar modo de manutenção:', error);
      return false;
    }
  }

  private async getMaxLoginAttempts(): Promise<number> {
    try {
      const settings = await this.prisma.systemSettings.findUnique({
        where: { key: 'system_settings' }
      });
      
      if (settings && settings.value) {
        const value = settings.value as any;
        return value?.system?.maxLoginAttempts || 5;
      }
      return 5;
    } catch (error) {
      console.error('Erro ao buscar máximo de tentativas:', error);
      return 5;
    }
  }

  private async getLoginAttempts(email: string): Promise<number> {
    try {
      const attemptsKey = `login_attempts_${email.toLowerCase()}`;
      const attemptsRecord = await this.prisma.systemSettings.findUnique({
        where: { key: attemptsKey }
      });
      
      if (attemptsRecord && attemptsRecord.value) {
        const data = attemptsRecord.value as any;
        const timestamp = data.timestamp || 0;
        const now = Date.now();
        // Resetar após 15 minutos
        if (now - timestamp > 15 * 60 * 1000) {
          await this.resetLoginAttempts(email);
          return 0;
        }
        return data.attempts || 0;
      }
      return 0;
    } catch (error) {
      console.error('Erro ao buscar tentativas de login:', error);
      return 0;
    }
  }

  private async incrementLoginAttempts(email: string): Promise<void> {
    try {
      const attemptsKey = `login_attempts_${email.toLowerCase()}`;
      const currentAttempts = await this.getLoginAttempts(email);
      
      await this.prisma.systemSettings.upsert({
        where: { key: attemptsKey },
        update: {
          value: {
            attempts: currentAttempts + 1,
            timestamp: Date.now()
          }
        },
        create: {
          key: attemptsKey,
          value: {
            attempts: 1,
            timestamp: Date.now()
          },
          description: `Tentativas de login para ${email}`
        }
      });
    } catch (error) {
      console.error('Erro ao incrementar tentativas de login:', error);
    }
  }

  private async resetLoginAttempts(email: string): Promise<void> {
    try {
      const attemptsKey = `login_attempts_${email.toLowerCase()}`;
      await this.prisma.systemSettings.deleteMany({
        where: { key: attemptsKey }
      });
    } catch (error) {
      console.error('Erro ao resetar tentativas de login:', error);
    }
  }

  private async checkPasswordExpiration(user: User): Promise<boolean> {
    try {
      // Buscar configuração de expiração de senha
      const settings = await this.prisma.systemSettings.findUnique({
        where: { key: 'system_settings' }
      });
      
      if (settings && settings.value) {
        const value = settings.value as any;
        const expirationDays = value?.security?.passwordExpiration || 90;
        
        // Se não tiver data de alteração, considerar como nunca alterada (criada na criação)
        const passwordChangedAt = user.passwordChangedAt || user.createdAt;
        const daysSinceChange = Math.floor(
          (Date.now() - new Date(passwordChangedAt).getTime()) / (1000 * 60 * 60 * 24)
        );
        
        return daysSinceChange >= expirationDays;
      }
      
      return false; // Se não houver configuração, não expira
    } catch (error) {
      console.error('Erro ao verificar expiração de senha:', error);
      return false; // Em caso de erro, não bloquear
    }
  }

  private generateToken(user: User): string {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      storeId: user.storeId,
    };
    return this.jwtService.sign(payload);
  }
}
