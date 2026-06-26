-- ============================================================================
-- DEV admin user — so the /admin console is reachable.
-- Login (mock): POST /auth/otp/verify { firebaseIdToken: "mock:+94770000000" }
-- The mock verifier maps that phone to this user; role=admin grants /admin access.
-- Idempotent.
-- ============================================================================
INSERT INTO users (phone, role, language, firebase_uid, district_id)
SELECT '+94770000000', 'admin', 'en', 'mock-+94770000000',
       (SELECT id FROM districts WHERE name_en = 'Kandy')
WHERE NOT EXISTS (SELECT 1 FROM users WHERE phone = '+94770000000');

-- If the user already existed as a customer, promote to admin (dev convenience).
UPDATE users SET role = 'admin' WHERE phone = '+94770000000' AND role <> 'admin';
