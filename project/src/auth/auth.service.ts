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

    // Verificar senha
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Senha incorreta');
    }

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

    // Atualizar senha
    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedNewPassword },
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
        data: { password: hashedNewPassword },
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
