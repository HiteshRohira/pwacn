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
  const replay = page.getByRole('button', { name: /Replay exact trace/ });
  await replay.click();
  await page.waitForFunction(
    () => {
      const button = document.querySelector('.replay-trace');
      return button instanceof HTMLButtonElement && !button.disabled;
    },
    undefined,
    { timeout: 5000 },
  );
  await expect(page.locator('[data-feel-state]')).toContainText(/settling|complete/);
  const telemetry = await page.evaluate(() => window.__PWACN_FEEL__!);
  expect(telemetry.samples.some((sample) => sample.state === 'releasing')).toBe(true);
  expect(telemetry.summary.sampleCount).toBeGreaterThan(3);
});

test('the press fixture records contact before activation', async ({ page }) => {
  await page.goto('/feel/press?scenario=quick-tap');
  await page.getByRole('button', { name: /Replay exact trace/ }).click();
  await expect(page.locator('[data-feel-state]')).toContainText(/releasing|complete/);
  const telemetry = await page.evaluate(() => window.__PWACN_FEEL__!);
  const states = telemetry.samples.map((sample) => sample.state);
  expect(states).toContain('contact');
  expect(states).toContain('responding');
  expect(telemetry.summary.eventToCommitMs).not.toBeNull();
  await expect(page.getByText('commit 01')).toBeVisible();
});

test('the interactive back fixture commits a deterministic edge gesture', async ({
  page,
}) => {
  await page.goto('/feel/interactive-back?scenario=slow-commit');
  const replay = page.getByRole('button', { name: /Replay exact trace/ });
  await replay.click();
  await expect(replay).toBeEnabled({ timeout: 5000 });
  await expect(page.getByRole('heading', { name: /Spatial index/ })).toBeVisible();
  const telemetry = await page.evaluate(() => window.__PWACN_FEEL__!);
  const states = telemetry.samples.map((sample) => sample.state);
  expect(states).toContain('dragging');
  expect(states).toContain('releasing');
  expect(states).toContain('route-commit');
});
