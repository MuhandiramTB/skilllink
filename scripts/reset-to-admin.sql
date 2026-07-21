-- ============================================================================
-- reset-to-admin.sql — wipe all app data EXCEPT admin users.
-- Keeps users where role='admin'; deletes every other user and all
-- transactional data. Most child tables cascade off users/bookings/providers,
-- but we truncate the independent ones explicitly for a clean slate.
-- IDEMPOTENT + guarded. Run: psql <conn> -f scripts/reset-to-admin.sql
-- ⚠ DESTRUCTIVE. Intended for resetting an environment to admin-only.
-- ============================================================================

BEGIN;

-- All transactional / user-derived tables. CASCADE covers any FK we don't list.
-- Preserved (NOT truncated): users (admins kept below), categories, districts,
-- app_settings, spatial_ref_sys.
TRUNCATE TABLE
    payments,
    payouts,
    booking_media,
    conversations,
    messages,
    notifications,
    disputes,
    reviews,
    provider_reports,
    safety_alerts,
    trusted_contacts,
    wallet_ledger,
    reward_ledger,
    reward_points,
    favourites,
    provider_photos,
    verifications,
    service_areas,
    provider_categories,
    bookings,
    providers,
    sessions,
    customer_profiles,
    audit_log
RESTART IDENTITY CASCADE;

-- Finally, delete every non-admin user. Admins are preserved.
DELETE FROM users WHERE role <> 'admin';

COMMIT;

-- Verify (should show only admin rows):
SELECT 'users_remaining' AS check, count(*) AS n FROM users
UNION ALL SELECT 'non_admin_users', count(*) FROM users WHERE role <> 'admin'
UNION ALL SELECT 'providers', count(*) FROM providers
UNION ALL SELECT 'bookings', count(*) FROM bookings
UNION ALL SELECT 'payments', count(*) FROM payments;
