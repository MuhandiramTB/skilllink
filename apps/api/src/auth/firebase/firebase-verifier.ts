import { Injectable, Logger } from '@nestjs/common';

/** Result of verifying an OTP credential — the identity Firebase would return. */
export interface VerifiedIdentity {
  firebaseUid: string;
  phone: string; // E.164
}

/**
 * Abstraction over OTP verification. The real implementation calls the Firebase
 * Admin SDK's verifyIdToken(); the mock lets us build & test the whole auth flow
 * locally without SMS. Selection is env-gated in auth.module.ts (AUTH_VERIFIER).
 */
export abstract class FirebaseVerifier {
  /** Verify a client-supplied Firebase ID token; throw if invalid. */
  abstract verifyIdToken(idToken: string): Promise<VerifiedIdentity>;
}

/**
 * MockVerifier — dev/test only.
 * Accepts a token of the form  "mock:<phone>"  e.g. "mock:+94771234567".
 * Anything else is treated as invalid (to exercise the 401 path).
 *
 * SAFETY: refuses to operate when NODE_ENV=production so it can never ship enabled,
 * even if the env wiring is misconfigured.
 */
@Injectable()
export class MockFirebaseVerifier extends FirebaseVerifier {
  constructor() {
    super();
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        'MockFirebaseVerifier must never run in production. Set AUTH_VERIFIER=firebase and provide Firebase Admin credentials.',
      );
    }
  }

  async verifyIdToken(idToken: string): Promise<VerifiedIdentity> {
    const match = /^mock:(\+94\d{9})$/.exec(idToken ?? '');
    if (!match) {
      throw new Error('INVALID_TOKEN');
    }
    const phone = match[1];
    // Deterministic uid from the phone so re-login maps to the same user.
    return { firebaseUid: `mock-${phone}`, phone };
  }
}

/**
 * RealFirebaseVerifier — verifies a Firebase ID token via the Firebase Admin SDK.
 *
 * The Admin SDK is loaded lazily so the dependency is only required when actually
 * running with AUTH_VERIFIER=firebase. Credentials come from the standard
 * GOOGLE_APPLICATION_CREDENTIALS env var, or FIREBASE_SERVICE_ACCOUNT (inline JSON).
 */
@Injectable()
export class RealFirebaseVerifier extends FirebaseVerifier {
  private readonly logger = new Logger(RealFirebaseVerifier.name);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private adminAuth: any | null = null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async auth(): Promise<any> {
    if (this.adminAuth) return this.adminAuth;
    // Lazy import keeps firebase-admin optional until this path is used (install it
    // only when running AUTH_VERIFIER=firebase). The dynamic specifier avoids a
    // compile-time module dependency for dev/mock builds.
    const moduleName = 'firebase-admin';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const admin: any = await import(moduleName);
    if (!admin.apps?.length) {
      const inline = process.env.FIREBASE_SERVICE_ACCOUNT;
      admin.initializeApp({
        credential: inline
          ? admin.credential.cert(JSON.parse(inline))
          : admin.credential.applicationDefault(),
      });
    }
    this.adminAuth = admin.auth();
    return this.adminAuth;
  }

  async verifyIdToken(idToken: string): Promise<VerifiedIdentity> {
    const auth = await this.auth();
    const decoded = await auth.verifyIdToken(idToken, true);
    const phone = decoded.phone_number as string | undefined;
    if (!phone) {
      // SkillLink is a phone/OTP product — a token with no verified phone is unusable.
      this.logger.warn(`Firebase token for uid=${decoded.uid} carried no phone_number`);
      throw new Error('NO_PHONE_IN_TOKEN');
    }
    return { firebaseUid: decoded.uid, phone };
  }
}
