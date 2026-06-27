import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TokenService, Role } from './token.service';
import { SessionService } from './session.service';
import { FirebaseVerifier } from './firebase/firebase-verifier';

export interface PublicUser {
  id: string;
  phone: string;
  roles: Role[]; // every role this account holds (customer always present)
  mode: Role; // role the dashboard is acting as right now
  language: 'si' | 'ta' | 'en';
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tokens: TokenService,
    private readonly sessions: SessionService,
    private readonly verifier: FirebaseVerifier,
  ) {}

  /**
   * Derive the role SET for an account:
   *  - customer: always (every account can book)
   *  - provider: iff a providers row exists for this user
   *  - admin:    iff users.role === 'admin'
   * The legacy users.role column is kept only as the admin flag — membership in the
   * customer/provider roles is derived, so a person is both without duplicate accounts.
   */
  private async deriveRoles(userId: string): Promise<Role[]> {
    const roles: Role[] = ['customer'];
    const [provider, user] = await Promise.all([
      this.prisma.providers.findUnique({ where: { user_id: userId }, select: { user_id: true } }),
      this.prisma.users.findUniqueOrThrow({ where: { id: userId }, select: { role: true } }),
    ]);
    if (provider) roles.push('provider');
    if (user.role === 'admin') roles.push('admin');
    return roles;
  }

  /** Default landing mode: admins land as admin, providers as provider, else customer. */
  private defaultMode(roles: Role[]): Role {
    if (roles.includes('admin')) return 'admin';
    if (roles.includes('provider')) return 'provider';
    return 'customer';
  }

  /** Req 1: OTP request. Server-side no-op beyond rate-limiting; no account enumeration. */
  async requestOtp(_phone: string): Promise<void> {
    return;
  }

  /** Req 2: verify OTP credential, upsert user, issue tokens. */
  async verifyOtp(firebaseIdToken: string): Promise<{
    accessToken: string;
    refreshToken: string;
    user: PublicUser;
  }> {
    let identity;
    try {
      identity = await this.verifier.verifyIdToken(firebaseIdToken);
    } catch {
      throw new UnauthorizedException({ code: 'AUTH_OTP_INVALID', message: 'errors.auth.otpInvalid' });
    }

    const userId = await this.findOrCreateUser(identity.firebaseUid, identity.phone);

    const full = await this.prisma.users.findUniqueOrThrow({ where: { id: userId } });
    if (!full.is_active) {
      throw new UnauthorizedException({ code: 'ACCOUNT_SUSPENDED', message: 'errors.auth.suspended' });
    }

    const roles = await this.deriveRoles(userId);
    const mode = this.defaultMode(roles);
    const accessToken = await this.tokens.signAccessToken({ sub: userId, roles, mode });
    const { refreshToken } = await this.sessions.create(userId);
    return {
      accessToken,
      refreshToken,
      user: { id: full.id, phone: full.phone, roles, mode, language: full.language },
    };
  }

  /** Req 2.4: create-if-absent with defaults role=customer, language=en. Returns userId. */
  private async findOrCreateUser(firebaseUid: string, phone: string): Promise<string> {
    const existing = await this.prisma.users.findUnique({ where: { phone } });
    const row =
      existing ??
      (await this.prisma.users.create({
        data: { phone, firebase_uid: firebaseUid, role: 'customer', language: 'en' },
      }));
    return row.id;
  }

  /** Req 4: refresh (rotation + replay defense in SessionService). Re-derives roles. */
  async refresh(rawToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    const { userId, refreshToken } = await this.sessions.rotate(rawToken);
    const roles = await this.deriveRoles(userId);
    const accessToken = await this.tokens.signAccessToken({
      sub: userId,
      roles,
      mode: this.defaultMode(roles),
    });
    return { accessToken, refreshToken };
  }

  /** Req 5: logout. */
  async logout(userId: string, opts: { refreshToken?: string; allDevices?: boolean }): Promise<void> {
    if (opts.allDevices) return this.sessions.revokeAll(userId);
    if (opts.refreshToken) return this.sessions.revokeByToken(opts.refreshToken);
    return this.sessions.revokeAll(userId);
  }

  /** Req 3: set language. */
  async setLanguage(userId: string, language: 'si' | 'ta' | 'en'): Promise<PublicUser> {
    await this.prisma.users.update({ where: { id: userId }, data: { language } });
    return this.me(userId);
  }

  /**
   * Switch the active dashboard mode. The account must hold the requested role;
   * this issues a fresh access token carrying the new mode (roles[] unchanged).
   */
  async setMode(userId: string, mode: Role): Promise<{ accessToken: string; mode: Role; roles: Role[] }> {
    const roles = await this.deriveRoles(userId);
    if (!roles.includes(mode)) {
      throw new BadRequestException({ code: 'MODE_NOT_ALLOWED', message: 'errors.auth.modeNotAllowed' });
    }
    const accessToken = await this.tokens.signAccessToken({ sub: userId, roles, mode });
    return { accessToken, mode, roles };
  }

  /**
   * Add the provider role to an existing account (creates the providers row) and
   * return a fresh token already switched into provider mode. Idempotent.
   */
  async becomeProvider(
    userId: string,
    businessName?: string,
  ): Promise<{ accessToken: string; roles: Role[]; mode: Role }> {
    const user = await this.prisma.users.findUniqueOrThrow({ where: { id: userId } });
    await this.prisma.providers.upsert({
      where: { user_id: userId },
      create: { user_id: userId, business_name: businessName ?? null, district_id: user.district_id },
      update: businessName ? { business_name: businessName } : {},
    });
    const roles = await this.deriveRoles(userId);
    const accessToken = await this.tokens.signAccessToken({ sub: userId, roles, mode: 'provider' });
    return { accessToken, roles, mode: 'provider' };
  }

  async me(userId: string): Promise<
    PublicUser & {
      profileComplete: boolean;
      fullName: string | null;
      email: string | null;
      districtId: string | null;
      avatarUrl: string | null;
      createdAt: Date;
    }
  > {
    const row = await this.prisma.users.findUniqueOrThrow({
      where: { id: userId },
      include: { customer_profile: true },
    });
    const roles = await this.deriveRoles(userId);
    const p = row.customer_profile;
    return {
      id: row.id,
      phone: row.phone,
      roles,
      mode: this.defaultMode(roles),
      language: row.language,
      profileComplete: !!p?.full_name,
      fullName: p?.full_name ?? null,
      email: p?.email ?? null,
      districtId: p?.district_id ?? null,
      avatarUrl: p?.avatar_url ?? null,
      createdAt: row.created_at,
    };
  }

  /**
   * Update profile. All fields optional so the profile page can do partial saves
   * (e.g. just the avatar, or just the name). Registration still sends the full set.
   */
  async updateProfile(
    userId: string,
    data: {
      fullName?: string;
      districtId?: string;
      language?: 'si' | 'ta' | 'en';
      email?: string;
      avatarUrl?: string;
    },
  ) {
    if (data.language || data.districtId) {
      await this.prisma.users.update({
        where: { id: userId },
        data: {
          ...(data.language ? { language: data.language } : {}),
          ...(data.districtId ? { district_id: data.districtId } : {}),
        },
      });
    }
    // Only write profile fields that were provided (undefined = leave unchanged).
    const set = {
      ...(data.fullName !== undefined ? { full_name: data.fullName } : {}),
      ...(data.districtId !== undefined ? { district_id: data.districtId } : {}),
      ...(data.email !== undefined ? { email: data.email || null } : {}),
      ...(data.avatarUrl !== undefined ? { avatar_url: data.avatarUrl || null } : {}),
    };
    await this.prisma.customer_profiles.upsert({
      where: { user_id: userId },
      create: { user_id: userId, ...set },
      update: set,
    });
    return this.me(userId);
  }

  /**
   * Presign an avatar upload. v1 returns deterministic mock URLs (Cloudinary wiring
   * pending), mirroring the provider-document flow — the client stores fileUrl via
   * updateProfile after the (future) PUT completes.
   */
  async avatarPresign(userId: string): Promise<{ uploadUrl: string; fileUrl: string }> {
    const stamp = userId.slice(0, 8);
    return {
      uploadUrl: `https://mock-upload.local/avatar/${userId}`,
      fileUrl: `https://mock-cdn.local/avatar/${stamp}-avatar.jpg`,
    };
  }
}
