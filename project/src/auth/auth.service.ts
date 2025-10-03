import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto, LoginDto, ChangePasswordDto } from '../dto/auth.dto';
import { User, UserRole } from '@prisma/client';

type UserWithoutPassword = Omit<User, 'password'>;

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

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
    return this.prisma.user.findUnique({ 
      where: { id },
      include: {
        store: true,
      },
    });
  }

  async checkEmailExists(email: string): Promise<{ exists: boolean }> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    return { exists: !!user };
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
