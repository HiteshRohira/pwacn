import { expect, test, type Page } from '@playwright/test';

const url = 'http://127.0.0.1:4174';

async function swipeBack(page: Page) {
  await page.waitForTimeout(700);
  const surface = page.locator('[data-pwacn-back-surface]').last();
  await expect(surface).toHaveCSS('transform', 'none');
  await surface.evaluate(async (node) => {
    const box = node.getBoundingClientRect();
    const y = box.top + box.height * 0.45;
    const xs = [0.48, 0.64, 0.8, 0.96].map((progress) => box.left + box.width * progress);
    const send = (type: string, x: number, buttons: number) =>
      node.dispatchEvent(
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
}

async function dragDeveloperSheetDown(page: Page) {
  await page.waitForTimeout(500);
  const handle = page.locator('.pwacn-sheet-handle-zone');
  await handle.evaluate(async (node) => {
    const box = node.getBoundingClientRect();
    const x = box.left + box.width / 2;
    const y = box.top + box.height / 2;
    const send = (type: string, clientY: number, buttons: number) =>
      node.dispatchEvent(
        new PointerEvent(type, {
          bubbles: true,
          cancelable: true,
          pointerId: 88,
          pointerType: 'touch',
          isPrimary: true,
          button: 0,
          buttons,
          clientX: x,
          clientY,
        }),
      );
    send('pointerdown', y, 1);
    for (const offset of [100, 220, 330]) {
      await new Promise((resolve) => setTimeout(resolve, 90));
      send('pointermove', y + offset, 1);
    }
    send('pointerup', y + 330, 0);
  });
}

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
  await expect(page.getByRole('heading', { name: 'Developer', level: 1 })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Press feel target' })).toBeVisible();
  await expect(page.getByText('INTERACTION TESTS')).toBeVisible();
  await page.getByRole('button', { name: /Bottom sheet/ }).tap();
  await expect(
    page.getByRole('dialog', { name: 'Bottom Sheet feel test' }),
  ).toBeVisible();
  await dragDeveloperSheetDown(page);
  await expect(page.getByRole('dialog', { name: 'Bottom Sheet feel test' })).toBeHidden();
});

test('body swipe navigates back without claiming the system edge', async ({ page }) => {
  await page.addInitScript(() => {
    window.__pwacnViewTransitions = 0;
    Object.defineProperty(document, 'startViewTransition', {
      configurable: true,
      value: (update: () => void) => {
        window.__pwacnViewTransitions += 1;
        update();
        return {
          finished: Promise.resolve(),
          ready: Promise.resolve(),
          updateCallbackDone: Promise.resolve(),
          skipTransition() {},
        };
      },
    });
  });
  await page.goto(url);
  await page.getByRole('button', { name: /Personal Hotspot/ }).tap();
  await expect(page.getByRole('heading', { name: 'Personal Hotspot' })).toBeVisible();
  const transitionsBeforeSwipe = await page.evaluate(() => window.__pwacnViewTransitions);
  await swipeBack(page);
  await expect(page.getByRole('heading', { name: 'Settings', level: 1 })).toBeVisible();
  expect(await page.evaluate(() => window.__pwacnViewTransitions)).toBe(
    transitionsBeforeSwipe,
  );
});

test('body swipe works at every nested stack depth', async ({ page }) => {
  await page.goto(url);
  await page.getByRole('button', { name: /General/ }).tap();
  await page.getByRole('button', { name: /Software Update/ }).tap();
  await expect(page.getByRole('heading', { name: 'Software Update' })).toBeVisible();
  await swipeBack(page);
  await expect(page.getByRole('heading', { name: 'General', level: 1 })).toBeVisible();
  await swipeBack(page);
  await expect(page.getByRole('heading', { name: 'Settings', level: 1 })).toBeVisible();
});

test('app chrome prevents text selection but inputs remain selectable', async ({
  page,
}) => {
  await page.goto(url);
  await expect(page.locator('.settings-stage')).toHaveCSS('user-select', 'none');
  await expect(page.getByPlaceholder('Search')).toHaveCSS('user-select', 'text');
  await page.getByRole('button', { name: /Developer/ }).tap();
  await page.getByRole('button', { name: /Bottom sheet/ }).tap();
  await expect(page.getByRole('dialog', { name: 'Bottom Sheet feel test' })).toHaveCSS(
    'user-select',
    'none',
  );
});

test('the feel sheet keeps a coherent dark appearance', async ({ page }) => {
  await page.goto(url);
  await page.getByRole('button', { name: /Display & Brightness/ }).tap();
  await page.getByRole('button', { name: 'Dark' }).tap();
  await page.getByRole('button', { name: /Settings/ }).tap();
  await page.getByRole('button', { name: /Developer/ }).tap();
  await page.getByRole('button', { name: /Bottom sheet/ }).tap();
  const dialog = page.getByRole('dialog', { name: 'Bottom Sheet feel test' });
  await expect(dialog).toHaveCSS('background-color', 'rgb(28, 28, 30)');
  await expect(dialog).toHaveCSS('color', 'rgb(255, 255, 255)');
});
