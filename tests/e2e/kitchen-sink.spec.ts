import { expect, test } from '@playwright/test';

const url = 'http://127.0.0.1:4174';

test('settings controls, search, and navigation are functional', async ({ page }) => {
  await page.goto(url);
  const airplane = page.getByRole('switch', { name: 'Airplane Mode' });
  await expect(airplane).toHaveAttribute('aria-checked', 'false');
  await airplane.tap();
  await expect(airplane).toHaveAttribute('aria-checked', 'true');
  await expect(page.getByRole('button', { name: /Wi-Fi Off/ })).toBeVisible();

  await page.getByPlaceholder('Search').fill('privacy');
  await expect(page.getByRole('button', { name: /Privacy & Security/ })).toBeVisible();
  await page.getByPlaceholder('Search').fill('');

  await page.getByRole('button', { name: /Wi-Fi Off/ }).tap();
  await expect(page.getByRole('heading', { name: 'Wi-Fi', level: 1 })).toBeVisible();
  await page.getByRole('button', { name: /Settings/ }).tap();
  await expect(page.getByRole('heading', { name: 'Settings', level: 1 })).toBeVisible();
});

test('specialized detail screens and account action sheet work', async ({ page }) => {
  await page.goto(url);
  await page.getByRole('button', { name: /Battery/ }).tap();
  await expect(page.getByText('Last 24 Hours', { exact: true }).first()).toBeVisible();
  await page.getByRole('button', { name: /Settings/ }).tap();
  await page.getByRole('button', { name: /Hitesh Kumar/ }).tap();
  await expect(
    page.getByRole('heading', { name: 'Apple Account', level: 1 }),
  ).toBeVisible();
  await page.getByRole('button', { name: /Personal Information/ }).tap();
  await expect(page.getByRole('dialog', { name: 'Account actions' })).toBeVisible();
  await page.getByRole('button', { name: 'Cancel' }).tap();
  await expect(page.getByRole('dialog', { name: 'Account actions' })).toBeHidden();
});

test('detail content and appearance controls are functional', async ({ page }) => {
  await page.goto(url);
  await page.getByRole('button', { name: /General/ }).tap();
  await page.getByRole('button', { name: /Software Update/ }).tap();
  await expect(page.getByText('Up to Date')).toBeVisible();
  await page.goBack();
  await expect(page.getByRole('heading', { name: 'General', level: 1 })).toBeVisible();
  await page.goForward();
  await expect(page.getByText('Up to Date')).toBeVisible();
  await page.goBack();
  await page.goBack();
  await page.getByRole('button', { name: /Display & Brightness/ }).tap();
  await page.getByRole('button', { name: 'Dark' }).tap();
  await expect(page.locator('html')).toHaveAttribute('data-pwacn-theme', 'dark');
});

test('developer screen exposes the on-device interaction feel lab', async ({ page }) => {
  await page.goto(url);
  await page.getByRole('button', { name: /Developer/ }).tap();
  await expect(page.getByRole('heading', { name: 'Interaction Feel Lab' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Press feel target' })).toBeVisible();
  await expect(page.getByText('Edge drag · reverse')).toBeVisible();
  await page.getByRole('button', { name: /Open sheet test/ }).tap();
  await expect(
    page.getByRole('dialog', { name: 'Bottom Sheet feel test' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Close sheet' }).tap();
  await expect(page.getByRole('dialog', { name: 'Bottom Sheet feel test' })).toBeHidden();
});
