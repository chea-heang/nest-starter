import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

// Protects routes — requires valid JWT Bearer token in Authorization header
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
