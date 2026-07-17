import { Injectable, CanActivate, ExecutionContext, Logger } from '@nestjs/common';
import { AuthService } from './auth.service';

@Injectable()
export class AuthGuard implements CanActivate {
  private readonly logger = new Logger(AuthGuard.name);

  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // TODO: Phase 1 - 实现统一鉴权逻辑
    return true;
  }
}
