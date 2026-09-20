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
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog', { name: 'Bottom Sheet feel test' })).toBeHidden();
});

test('body swipe navigates back without claiming the system edge', async ({ page }) => {
  await page.goto(url);
  await page.getByRole('button', { name: /Personal Hotspot/ }).tap();
  await expect(page.getByRole('heading', { name: 'Personal Hotspot' })).toBeVisible();
  await page.locator('[data-pwacn-back-surface]').evaluate(async (surface) => {
    const box = surface.getBoundingClientRect();
    const y = box.top + box.height * 0.45;
    const xs = [0.48, 0.62, 0.78, 0.94].map(
      (progress) => box.left + box.width * progress,
    );
    const send = (type: string, x: number, buttons: number) =>
      surface.dispatchEvent(
        new PointerEvent(type, {
          bubbles: true,
          cancelable: true,
          pointerId: 77,
          pointerType: 'touch',
          isPrimary: true,
          button: 0,
          buttons,
          clientX: x,
          clientY: y,
        }),
      );
    send('pointerdown', xs[0]!, 1);
    for (const x of xs.slice(1)) {
      await new Promise((resolve) => setTimeout(resolve, 70));
      send('pointermove', x, 1);
    }
    send('pointerup', xs.at(-1)!, 0);
  });
  await expect(page.getByRole('heading', { name: 'Settings', level: 1 })).toBeVisible();
});

test('the feel sheet keeps a coherent dark appearance', async ({ page }) => {
  await page.goto(url);
  await page.getByRole('button', { name: /Display & Brightness/ }).tap();
  await page.getByRole('button', { name: 'Dark' }).tap();
  await page.getByRole('button', { name: /Settings/ }).tap();
  await page.getByRole('button', { name: /Developer/ }).tap();
  await page.getByRole('button', { name: /Open sheet test/ }).tap();
  const dialog = page.getByRole('dialog', { name: 'Bottom Sheet feel test' });
  await expect(dialog).toHaveCSS('background-color', 'rgb(28, 28, 30)');
  await expect(dialog).toHaveCSS('color', 'rgb(255, 255, 255)');
});
