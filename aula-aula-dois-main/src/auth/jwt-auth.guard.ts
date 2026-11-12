import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

interface AuthenticatedUser {
  sub: number;
  email: string;
}

type AuthenticatedRequest = Request & {
  params: Request['params'] & { userId?: string };
  user?: AuthenticatedUser;
};

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const authorization = request.headers.authorization;
    const [scheme, token, ...extra] = authorization?.split(' ') ?? [];

    if (scheme !== 'Bearer' || !token || extra.length > 0) {
      throw new UnauthorizedException('Token de acesso não informado');
    }

    let payload: AuthenticatedUser;
    try {
      payload = await this.jwtService.verifyAsync<AuthenticatedUser>(token);
    } catch {
      throw new UnauthorizedException('Token de acesso inválido ou expirado');
    }

    if (!Number.isInteger(payload.sub) || typeof payload.email !== 'string') {
      throw new UnauthorizedException('Token de acesso inválido');
    }

    const requestedUserId = request.params.userId ?? request.params.id;
    if (requestedUserId && Number(requestedUserId) !== payload.sub) {
      throw new ForbiddenException('Você não tem acesso a este recurso');
    }

    request.user = payload;
    return true;
  }
}
