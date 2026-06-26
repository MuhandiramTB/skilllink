import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { TokenService } from './token.service';
import { SessionService } from './session.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import {
  FirebaseVerifier,
  MockFirebaseVerifier,
  RealFirebaseVerifier,
} from './firebase/firebase-verifier';

/**
 * Verifier selection (env-gated):
 *  - AUTH_VERIFIER=firebase            → real Firebase Admin SDK
 *  - AUTH_VERIFIER=mock (dev default)  → mock; never permitted in production
 * In production the mock is forbidden regardless of env, so a misconfigured
 * deploy fails closed rather than accepting "mock:" tokens.
 */
function selectVerifier(): new () => FirebaseVerifier {
  const choice = process.env.AUTH_VERIFIER ?? 'mock';
  if (choice === 'firebase') return RealFirebaseVerifier;
  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'AUTH_VERIFIER must be "firebase" in production. The mock verifier is disabled.',
    );
  }
  return MockFirebaseVerifier;
}

@Module({
  controllers: [AuthController],
  providers: [
    AuthService,
    TokenService,
    SessionService,
    JwtAuthGuard,
    RolesGuard,
    {
      provide: FirebaseVerifier,
      useClass: selectVerifier(),
    },
  ],
  exports: [TokenService, SessionService, JwtAuthGuard, RolesGuard],
})
export class AuthModule {}
