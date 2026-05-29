import { expect, test } from '@playwright/test';

test('loads the aviation dashboard', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /plan resilient routes/i })).toBeVisible();
});

test('searches a route and opens route intelligence', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Departure').fill('Indira');
  await page.getByRole('button', { name: /VIDP/i }).click();
  await page.getByLabel('Arrival').fill('Kempegowda');
  await page.getByRole('button', { name: /VOBL/i }).click();
  await page.getByRole('button', { name: /search routes/i }).click();
  await page.locator('.flight-row').first().click();

  await expect(page.getByRole('heading', { name: /VIDP to VOBL/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /export json/i })).toBeVisible();
  await expect(page.getByText(/weather impact/i)).toBeVisible();
});
