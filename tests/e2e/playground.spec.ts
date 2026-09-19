import { expect, test } from '@playwright/test';

test('the playground hosts the interaction tuning laboratory', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /Physical controls/ })).toBeVisible();
  await page.getByRole('button', { name: /Open multi-snap sheet/ }).tap();
  await expect(page.getByRole('dialog', { name: 'Snap point laboratory' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog', { name: 'Snap point laboratory' })).toBeHidden();
});

test('the sheet feel fixture records a deterministic drag and release', async ({
  page,
}) => {
  await page.goto('/feel/sheet?scenario=slow-snap');
  await page.getByRole('button', { name: /Replay exact trace/ }).click();
  await expect(page.locator('[data-feel-state]')).toContainText(/settling|complete/);
  const telemetry = await page.evaluate(() => window.__PWACN_FEEL__!);
  expect(telemetry.samples.some((sample) => sample.state === 'releasing')).toBe(true);
  expect(telemetry.summary.sampleCount).toBeGreaterThan(3);
});
