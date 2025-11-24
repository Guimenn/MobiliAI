import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private authService: AuthService,
    private configService: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: any) {
    try {
      const user = await this.authService.findUserById(payload.sub);

      if (!user || !user.isActive) {
        throw new UnauthorizedException();
      }
      return user;
    } catch (error: any) {
      // Se for erro de conexão com banco, tentar novamente após um delay
      if (error.code === 'P1017' || error.message?.includes('Server has closed the connection') || error.message?.includes('db_termination')) {
        console.warn('Erro de conexão ao validar token, tentando novamente...');
        // Aguardar um pouco e tentar novamente
        await new Promise(resolve => setTimeout(resolve, 1000));
        try {
          const user = await this.authService.findUserById(payload.sub);
          if (!user || !user.isActive) {
            throw new UnauthorizedException();
          }
          return user;
        } catch (retryError) {
          console.error('Erro ao validar token após retry:', retryError);
          throw new UnauthorizedException('Erro ao validar autenticação');
        }
      }
      // Re-lançar outros erros
      throw error;
    }
  }
}
