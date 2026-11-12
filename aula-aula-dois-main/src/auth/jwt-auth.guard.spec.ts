import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { JwtAuthGuard } from './jwt-auth.guard';

describe('JwtAuthGuard', () => {
  const jwtService = {
    verifyAsync: jest.fn(),
  };
  const guard = new JwtAuthGuard(jwtService as unknown as JwtService);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  function contextFor(authorization?: string): {
    context: ExecutionContext;
    request: {
      headers: Record<string, string>;
      params: { id?: string; userId?: string };
      user?: { sub: number; email: string };
    };
  } {
    const request: {
      headers: Record<string, string>;
      params: { id?: string; userId?: string };
      user?: { sub: number; email: string };
    } = { headers: {}, params: {} };
    if (authorization) {
      request.headers.authorization = authorization;
    }

    const context = {
      switchToHttp: () => ({ getRequest: () => request }),
    } as unknown as ExecutionContext;

    return { context, request };
  }

  it('rejects requests without a bearer token', async () => {
    const { context } = contextFor();

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(jwtService.verifyAsync).not.toHaveBeenCalled();
  });

  it('verifies a bearer token and attaches its user to the request', async () => {
    const user = { sub: 7, email: 'ana@example.com' };
    const { context, request } = contextFor('Bearer valid-token');
    request.params.userId = '7';
    jwtService.verifyAsync.mockResolvedValue(user);

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(request.user).toEqual(user);
  });

  it('rejects invalid or expired tokens', async () => {
    const { context } = contextFor('Bearer invalid-token');
    jwtService.verifyAsync.mockRejectedValue(new Error('Invalid token'));

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('rejects access to another user’s resources', async () => {
    const { context } = contextFor('Bearer valid-token');
    jwtService.verifyAsync.mockResolvedValue({
      sub: 7,
      email: 'ana@example.com',
    });
    const request = context
      .switchToHttp()
      .getRequest<{ params: { userId: string } }>();
    request.params.userId = '8';

    await expect(guard.canActivate(context)).rejects.toThrow(
      'Você não tem acesso a este recurso',
    );
  });
});
