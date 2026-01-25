import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { passportJwtSecret } from 'jwks-rsa';

export interface JwtPayload {
  sub: string;
  email?: string;
  phone?: string;
  aud: string;
  role: string;
  aal?: string;
  amr?: Array<{ method: string; timestamp: number }>;
  session_id?: string;
  is_anonymous?: boolean;
  app_metadata?: Record<string, unknown>;
  user_metadata?: Record<string, unknown>;
  iat: number;
  exp: number;
}

export interface AuthenticatedUser {
  id: string;
  email?: string;
  phone?: string;
  isAnonymous: boolean;
  appMetadata: Record<string, unknown>;
  userMetadata: Record<string, unknown>;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(configService: ConfigService) {
    const supabaseUrl = configService.get<string>('SUPABASE_URL');
    const jwksUrl = configService.get<string>('SUPABASE_JWKS_URL');

    if (!supabaseUrl || !jwksUrl) {
      throw new Error('SUPABASE_URL and SUPABASE_JWKS_URL must be defined');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      algorithms: ['RS256'],
      issuer: `${supabaseUrl}/auth/v1`,
      audience: 'authenticated',
      secretOrKeyProvider: passportJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri: jwksUrl,
      }),
    });
  }

  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    if (!payload.sub) {
      throw new UnauthorizedException('Invalid token: missing subject');
    }

    return {
      id: payload.sub,
      email: payload.email,
      phone: payload.phone,
      isAnonymous: payload.is_anonymous ?? false,
      appMetadata: payload.app_metadata ?? {},
      userMetadata: payload.user_metadata ?? {},
    };
  }
}
