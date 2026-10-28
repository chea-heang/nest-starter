import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UserPayload } from '../interfaces/user.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      // Extract Bearer token from Authorization header
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      // Validate against the ACCESS token secret only
      secretOrKey: process.env.JWT_ACCESS_SECRET ?? 'fallback_access_secret',
    });
  }

  /**
   * Called after signature is verified.
   * Returned value is attached to req.user.
   */
  async validate(payload: UserPayload) {
    return {
      sub: payload.sub,
      email: payload.email,
      name: payload.name,
    };
  }
}
