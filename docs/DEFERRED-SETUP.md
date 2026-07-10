# Deferred setup — needs accounts / credentials

These features are **built in code but stubbed behind config**. They do nothing until you add the env vars below (and, where noted, an external account). No code changes are needed to enable them — set the vars, redeploy the API.

> Set all of these in the **Azure Container App** environment (production) and in `apps/api/.env` for local testing.

---

## 1. Off-app notifications — SMS (highest priority)

Async matching genuinely needs SMS so a provider not in the app still gets "New job request".

- **Account:** an SMS gateway. In Sri Lanka: **Dialog / Mobitel / Text.lk**, or **Twilio** internationally.
- **Env:** `SMS_PROVIDER_KEY=<api key>` (the channel enables the moment this is set — see `apps/api/src/notifications/channels/sms.channel.ts`).
- **Code to finish:** implement the `send()` body in `sms.channel.ts` (POST to the gateway with `p.phone` + a short body). The interface + fan-out already work.

## 2. Off-app notifications — Push (FCM)

- **Account:** Firebase project → Cloud Messaging.
- **Env:** `FCM_SERVER_KEY=<key>`.
- **Code to finish:** store device tokens per user (needs a small `device_tokens` table + a register endpoint), then implement `push.channel.ts` `send()`. Interface is ready.

## 3. Off-app notifications — Email

- **Env:** `EMAIL_FROM=noreply@yourdomain` + `SMTP_URL=smtp://user:pass@host:port` (or swap for SES/Resend).
- **Code to finish:** implement `email.channel.ts` `send()` with a transport (e.g. nodemailer). Currently logs the email in dev.

> Note: user **notification preferences are already respected** — `NotifierService` checks `notif_prefs:<userId>` and won't send a category the user turned off (safety alerts always send).

## 4. Image storage → object storage (scale)

Today images are base64 data-URLs in Postgres (works, but bloats the DB and skips CDN). At island-wide scale, move to object storage.

- **Account:** an **Azure Blob Storage** container (you're already on Azure) or S3.
- **Env:** `STORAGE_ACCOUNT`, `STORAGE_CONTAINER`, `STORAGE_KEY` (naming your choice).
- **Migration path:** add a presigned-upload endpoint; the web already downscales client-side (`lib/image.ts`) — change `addPhoto`/`uploadAvatar` to upload the blob and send the **URL** instead of the data-URL. The DB column is already `text`, so it holds a URL with no schema change.

## 5. Cancellation-fee collection

The policy **records** `cancel_fee_cents` on the booking but nothing **collects** it — that ties to the payments gateway (deferred). Once payments land, settle the fee against the customer's payment / the provider payout.

---

## Still fully deferred (out of current scope)
- **Payments gateway** (PayHere/Genie) — only `MockPaymentGateway` exists.
- **OTP / Firebase auth** — `AUTH_VERIFIER=firebase` required in production; the mock is refused there.

## Trust & safety — process, not code
Verification is upload + admin approval today. Before a real in-home launch, decide: background-check depth, police-clearance enforcement, and a stated **liability/insurance** position. These are policy/vendor decisions, not code gaps.
