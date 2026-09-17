import { expect, test } from '@playwright/test';

test('the playground hosts the interaction tuning laboratory', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /Physical controls/ })).toBeVisible();
  await page.getByRole('button', { name: /Open multi-snap sheet/ }).tap();
  await expect(page.getByRole('dialog', { name: 'Snap point laboratory' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog', { name: 'Snap point laboratory' })).toBeHidden();
});
