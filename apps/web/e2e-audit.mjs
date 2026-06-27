// One-off UX audit: visit every page in mobile + desktop viewports, capture
// screenshots, console errors, horizontal overflow, and small tap targets.
// Run with both servers up:  node e2e-audit.mjs
import { chromium, devices } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'fs';

const WEB = 'http://localhost:3000';
const API = 'http://localhost:4000/api/v1';
const OUT = 'audit-shots';
mkdirSync(OUT, { recursive: true });

// Pages to visit. `auth` = which role's token to inject before navigating.
const PAGES = [
  { name: 'landing',           path: '/en',                         auth: null },
  { name: 'login',             path: '/en/login',                   auth: null },
  { name: 'register',          path: '/en/register',                auth: 'customer' },
  { name: 'dash-customer',     path: '/en/dashboard/customer',      auth: 'customer' },
  { name: 'dash-provider',     path: '/en/dashboard/provider',      auth: 'provider' },
  { name: 'dash-admin',        path: '/en/dashboard/admin',         auth: 'admin' },
  { name: 'bookings',          path: '/en/bookings',                auth: 'customer' },
  { name: 'provider-home',     path: '/en/provider',                auth: 'provider' },
  { name: 'provider-jobs',     path: '/en/provider/jobs',           auth: 'provider' },
  { name: 'provider-register', path: '/en/provider/register',       auth: 'customer' },
  { name: 'admin-login',       path: '/en/admin/login',             auth: null },
  { name: 'admin-users',       path: '/en/admin/users',             auth: 'admin' },
  { name: 'admin-verifications',path: '/en/admin/verifications',    auth: 'admin' },
  { name: 'admin-categories',  path: '/en/admin/categories',        auth: 'admin' },
  { name: 'admin-districts',   path: '/en/admin/districts',         auth: 'admin' },
  { name: 'admin-disputes',    path: '/en/admin/disputes',          auth: 'admin' },
  { name: 'admin-payments',    path: '/en/admin/payments',          auth: 'admin' },
  { name: 'admin-audit',       path: '/en/admin/audit',             auth: 'admin' },
];

const VIEWPORTS = [
  { id: 'mobile', ...devices['iPhone 12'] },          // 390x844, mobile UA, touch
  { id: 'desktop', viewport: { width: 1440, height: 900 } },
];

// Get tokens once via the API mock login.
async function tokenFor(phone) {
  const r = await fetch(`${API}/auth/otp/verify`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ firebaseIdToken: `mock:${phone}` }),
  });
  const b = await r.json();
  if (b.error) throw new Error(`login ${phone}: ${b.error.message}`);
  return b.data.accessToken;
}

const findings = [];

async function run() {
  // Pick concrete accounts. Admin = +94770000000. Provider = a known provider phone.
  // Customer = a fresh number (auto-created). Provider phone: find one via API? We
  // know +94770000000 is admin; create a provider by logging in fresh then we use
  // a real seeded provider — fall back to admin's customer mode if none.
  const tokens = {
    admin: await tokenFor('+94770000000'),
    customer: await tokenFor('+94771112233'),
    provider: await tokenFor('+94772223344'),
  };
  // Make the customer→provider so the provider dashboard has a providers row.
  await fetch(`${API}/auth/become-provider`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokens.provider}` },
    body: JSON.stringify({ businessName: 'Audit Test Services' }),
  }).then(r => r.json()).then(b => { if (b.data?.accessToken) tokens.provider = b.data.accessToken; });

  const browser = await chromium.launch();

  for (const vp of VIEWPORTS) {
    const context = await browser.newContext({ ...vp });
    const page = await context.newPage();

    for (const P of PAGES) {
      const consoleErrors = [];
      page.removeAllListeners('console');
      page.removeAllListeners('pageerror');
      page.on('console', m => { if (m.type() === 'error') consoleErrors.push(m.text()); });
      page.on('pageerror', e => consoleErrors.push('PAGEERROR: ' + e.message));

      // Inject token before navigation so guarded pages render.
      if (P.auth) {
        await page.addInitScript((t) => {
          window.localStorage.setItem('skilllink_admin_token', t);
        }, tokens[P.auth]);
      } else {
        await page.addInitScript(() => window.localStorage.removeItem('skilllink_admin_token'));
      }

      let navError = null;
      try {
        await page.goto(`${WEB}${P.path}`, { waitUntil: 'networkidle', timeout: 20000 });
      } catch (e) { navError = e.message; }
      await page.waitForTimeout(800); // let client fetches settle

      const shot = `${OUT}/${P.name}-${vp.id}.png`;
      await page.screenshot({ path: shot, fullPage: true }).catch(() => {});

      // Layout checks (run in page context).
      const metrics = await page.evaluate(() => {
        const doc = document.documentElement;
        const horizOverflow = doc.scrollWidth - doc.clientWidth;
        // tap targets smaller than 40px (WCAG 44px is ideal; flag <40 hard)
        const interactive = [...document.querySelectorAll('button, a, input, select, [role=button]')];
        let tiny = 0;
        for (const el of interactive) {
          const r = el.getBoundingClientRect();
          if (r.width > 0 && r.height > 0 && (r.height < 32 || r.width < 32)) tiny++;
        }
        // inputs missing font-size >= 16 (causes iOS zoom-on-focus)
        let smallFontInputs = 0;
        for (const el of document.querySelectorAll('input, select, textarea')) {
          const fs = parseFloat(getComputedStyle(el).fontSize);
          if (fs && fs < 16) smallFontInputs++;
        }
        const bodyText = document.body.innerText.slice(0, 200).replace(/\s+/g, ' ').trim();
        return { horizOverflow, tiny, interactiveCount: interactive.length, smallFontInputs, bodyText };
      }).catch(() => ({}));

      const finding = {
        page: P.name, viewport: vp.id, url: P.path, shot,
        navError,
        consoleErrors: consoleErrors.slice(0, 5),
        horizOverflow: metrics.horizOverflow,
        tinyTapTargets: metrics.tiny,
        smallFontInputs: metrics.smallFontInputs,
        preview: metrics.bodyText,
      };
      findings.push(finding);
      const flags = [];
      if (navError) flags.push('NAV-FAIL');
      if (consoleErrors.length) flags.push(`${consoleErrors.length} console-err`);
      if (metrics.horizOverflow > 2) flags.push(`H-OVERFLOW ${metrics.horizOverflow}px`);
      if (metrics.smallFontInputs) flags.push(`${metrics.smallFontInputs} <16px inputs`);
      if (metrics.tiny) flags.push(`${metrics.tiny} tiny-targets`);
      console.log(`[${vp.id}] ${P.name.padEnd(20)} ${flags.length ? flags.join(', ') : 'ok'}`);
    }
    await context.close();
  }
  await browser.close();
  writeFileSync(`${OUT}/findings.json`, JSON.stringify(findings, null, 2));
  console.log(`\nDone. ${findings.length} page-views captured to ${OUT}/`);
}

run().catch(e => { console.error('AUDIT FAILED:', e); process.exit(1); });
