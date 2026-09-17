import { expect, test } from '@playwright/test';

test('the playground hosts the complete Settings benchmark', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Settings', level: 1 })).toBeVisible();
  await expect(page.getByRole('button', { name: /Hitesh Kumar/ })).toBeVisible();
  await page.getByRole('button', { name: /General/ }).tap();
  await expect(page.getByRole('heading', { name: 'General', level: 1 })).toBeVisible();
  await page.getByRole('button', { name: /Software Update/ }).tap();
  await expect(
    page.getByRole('heading', { name: 'Software Update', level: 1 }),
  ).toBeVisible();
});
