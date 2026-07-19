-- ============================================================================
-- 099: RESET all mock/test/transactional data + re-seed clean demo providers.
-- Keeps: schema, districts, categories, app_settings, and the admin user.
-- Wipes: all bookings/disputes/reviews/messages/notifications/safety/wallet/
--        favourites/referrals ledger + ALL non-admin users & providers.
-- Then re-runs the realistic Kandy provider seed (8 approved+available pros).
-- Idempotent. Run against the target DB with psql -f.
-- ============================================================================

BEGIN;

-- 1) Transactional / activity data (children first).
TRUNCATE TABLE
  messages, conversations,
  provider_reports, safety_alerts, trusted_contacts,
  reviews, disputes,
  wallet_ledger, reward_ledger, reward_points,
  payments, payouts,
  booking_media, bookings,
  favourites, notifications
RESTART IDENTITY CASCADE;

-- 2) Provider config for NON-admin providers (so we can delete the users cleanly).
DELETE FROM provider_categories
  WHERE provider_id IN (SELECT user_id FROM providers);
DELETE FROM service_areas
  WHERE provider_id IN (SELECT user_id FROM providers);
DELETE FROM verifications
  WHERE provider_id IN (SELECT user_id FROM providers);
DELETE FROM provider_photos
  WHERE provider_id IN (SELECT user_id FROM providers);
DELETE FROM providers;

-- 3) All non-admin users (customers + ex-providers). Keep admins + their profile.
DELETE FROM customer_profiles
  WHERE user_id IN (SELECT id FROM users WHERE role <> 'admin');
DELETE FROM sessions
  WHERE user_id IN (SELECT id FROM users WHERE role <> 'admin');
DELETE FROM email_otps;
DELETE FROM users WHERE role <> 'admin';

COMMIT;

-- Post-reset counts (sanity).
SELECT 'users' AS t, count(*) FROM users
UNION ALL SELECT 'providers', count(*) FROM providers
UNION ALL SELECT 'bookings', count(*) FROM bookings;
