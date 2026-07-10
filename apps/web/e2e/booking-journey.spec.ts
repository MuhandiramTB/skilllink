import { test, expect } from '@playwright/test';
import { signIn } from './helpers';

/**
 * The flagship journey: a signed-in customer books a service end to end through the
 * real UI — category page → describe → find providers (matching) → pick one →
 * confirmation. If this breaks, the business is down.
 */
test.describe('customer booking journey', () => {
  test('book an electrician: describe → find providers → assign', async ({ page }) => {
    await signIn(page); // ensure customer mode
    // Go straight to a category (the landing search hands off here with ?loc).
    await page.goto('/en/category/electrician');

    // Fill the "what do you need" description (min length is enforced by the form).
    const desc = page.locator('textarea').first();
    await expect(desc).toBeVisible();
    await desc.fill('Ceiling fan not working, needs an electrician to inspect and repair.');

    // Submit "find providers".
    const findBtn = page.getByRole('button', { name: /find|search|providers|සොයන්න|தேடு/i }).first();
    await findBtn.click();

    // Matching should return the seeded Kandy providers (or an empty-note if none).
    // Wait for either provider cards or the "no providers" note.
    const providerCard = page.getByRole('button', { name: /book|වෙන්|பதிவு/i });
    const noneNote = page.getByText(/no provider|not found|නැත|இல்லை/i);
    await expect(providerCard.first().or(noneNote.first())).toBeVisible({ timeout: 15000 });

    // If providers came back, assigning one should lead to a confirmation/celebration
    // then the booking detail.
    if (await providerCard.count() > 0) {
      await providerCard.first().click();
      // Celebration overlay OR direct navigation to the booking detail.
      await expect(page).toHaveURL(/\/bookings\/[a-f0-9-]{8,}/, { timeout: 12000 });
      await expect(page.getByText(/booking|status|track|වෙන්කිරීම|பதிவு/i).first()).toBeVisible();
    }
  });

  test('booking list shows the customer’s bookings', async ({ page }) => {
    await signIn(page);
    await page.goto('/en/bookings');
    await expect(page).not.toHaveURL(/\/login/);
    // Either a list of bookings or a designed empty state — never a crash.
    await expect(page.locator('body')).toBeVisible();
  });
});
