# Real-Integration Swap Guide

**Owner:** Architect · **Audience:** developer wiring production before pilot.

The MVP was built with **mock adapters** behind clean interfaces, so swapping to real
services is a localized change — no caller code changes. Each is selected by an env var.

---

## 1. Firebase Phone Auth (OTP) — replaces `MockFirebaseVerifier`
**Interface:** `apps/api/src/auth/firebase/firebase-verifier.ts` (`FirebaseVerifier`)
**Env:** `AUTH_VERIFIER=firebase`

**Steps:**
1. Create a Firebase project; enable **Phone** sign-in. Add SHA / web app as needed.
2. Generate an Admin SDK service account → set `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`.
3. Add `RealFirebaseVerifier implements FirebaseVerifier` using `firebase-admin`:
   ```ts
   verifyIdToken(idToken) → admin.auth().verifyIdToken(idToken) → { firebaseUid: uid, phone: phone_number }
   ```
4. In `auth.module.ts`, provide the real class when `AUTH_VERIFIER==='firebase'`.
5. Frontend: use the Firebase JS SDK to send/verify the SMS code, then POST the resulting ID token to `/auth/otp/verify`.
**Acceptance:** real OTP SMS arrives in LK; verify issues our JWT. No other code changes.

## 2. Cloudinary (media) — replaces `MockMediaUploader`
**Interface:** `apps/api/src/providers/media/media-uploader.ts` (`MediaUploader`)
**Env:** `MEDIA_UPLOADER=cloudinary`, `CLOUDINARY_URL`

**Steps:**
1. Create a Cloudinary account; get the API key/secret.
2. Add `CloudinaryUploader implements MediaUploader` whose `presign()` returns a **signed**
   direct-upload URL + the resulting secure `fileUrl`.
3. Provide it in `providers.module.ts` when env is `cloudinary`.
4. Frontend uploads directly to Cloudinary using the signed params, then sends `fileUrl` to the API.
**Acceptance:** NIC/selfie/booking photos stored in Cloudinary; API never handles raw bytes.

## 3. PayHere / Genie (payments) — replaces `MockPaymentGateway`
**Interface:** `apps/api/src/payments/gateway/payment-gateway.ts` (`PaymentGateway`)
**Env:** `PAYMENT_GATEWAY=payhere|genie`, merchant creds

**Steps:**
1. Complete PayHere (and/or Genie) merchant onboarding; get merchant id + secret.
2. Add `PayHereGateway implements PaymentGateway`:
   - `createSession()` → build a PayHere checkout (hash with merchant secret) → return redirectUrl + ref.
   - `verifyWebhook()` → validate PayHere's `md5sig` signature; map to our idempotency key.
3. Provide it in `payments.module.ts` by env.
4. Point PayHere's notify URL at `POST /api/v1/payments/webhook`.
**Acceptance:** sandbox payment completes end-to-end; webhook confirms idempotently; commission retained.

## 4. Notifications (FCM/SMS) — not yet built
Add a `Notifier` interface (mock + FCM/SMS impls) for: provider job alerts, approval/rejection,
booking status. Wire into bookings/providers/verification events. Defer until after pilot validation.

## 5. Maps (geocoding/UI) — partially deferred
Matching already uses PostGIS for distance. For address→coordinates and a map picker, add
Google Maps Platform (`GOOGLE_MAPS_API_KEY`) in the web booking flow (replaces the Kandy-town default).

---

## Switchboard summary
| Capability | Interface | Env | Mock (now) | Real (pilot) |
|-----------|-----------|-----|------------|--------------|
| OTP | FirebaseVerifier | AUTH_VERIFIER | ✅ | firebase-admin |
| Media | MediaUploader | MEDIA_UPLOADER | ✅ | Cloudinary signed |
| Payments | PaymentGateway | PAYMENT_GATEWAY | ✅ | PayHere/Genie |
| Notifications | (Notifier) | — | — | FCM/SMS |
| Maps picker | (web) | GOOGLE_MAPS_API_KEY | Kandy default | Google Maps |

**Principle:** every external dependency is behind an interface chosen by env. Real wiring is
additive (new class + provider binding), never a rewrite.
