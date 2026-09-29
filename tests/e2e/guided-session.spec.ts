import { expect, test } from '@playwright/test';

test.use({ serviceWorkers: 'block' });

test('guided mobile session delivers prompts and correlates app gestures', async ({
  page,
}) => {
  const batches: Array<Array<Record<string, unknown>>> = [];
  let prompt = { sequence: 0, text: '' };
  let uploaded = false;
  await page.route('https://lab.trycloudflare.com/api/**', async (route) => {
    const url = new URL(route.request().url());
    const headers = {
      'access-control-allow-origin': 'http://127.0.0.1:4174',
      'access-control-allow-methods': 'GET, POST, OPTIONS',
      'access-control-allow-headers': 'Content-Type',
      'content-type': 'application/json',
    };
    if (route.request().method() === 'OPTIONS')
      return route.fulfill({ status: 204, headers });
    if (url.pathname === '/api/prompt')
      return route.fulfill({ status: 200, headers, body: JSON.stringify(prompt) });
    if (url.pathname === '/api/events') {
      const body = route.request().postDataJSON() as {
        events: Array<Record<string, unknown>>;
      };
      batches.push(body.events);
      return route.fulfill({ status: 200, headers, body: '{}' });
    }
    if (url.pathname === '/api/video') {
      uploaded = true;
      return route.fulfill({ status: 200, headers, body: '{}' });
    }
    return route.fulfill({ status: 404, headers, body: '{}' });
  });
  const params = new URLSearchParams({
    guided: '1',
    relay: 'https://lab.trycloudflare.com',
    session: 'test',
    token: 'secret',
  });
  await page.goto(`http://127.0.0.1:4174/instagram?${params}`);
  await page.getByRole('button', { name: 'Start test' }).tap();
  await expect(page.getByText('SYNC')).toBeVisible();
  prompt = { sequence: 1, text: 'Explore stories for a moment' };
  await expect(page.getByRole('heading', { name: prompt.text })).toBeVisible();
  await page.getByRole('button', { name: 'Start task' }).tap();
  await page.getByRole('button', { name: "View olivia.june's story" }).tap();
  await expect(page.getByRole('region', { name: "olivia.june's story" })).toBeVisible();
  await page.getByRole('button', { name: 'Open test controls' }).tap();
  await page.getByRole('button', { name: 'Mark issue' }).tap();
  await expect
    .poll(() => batches.flat().some((event) => event.type === 'user-mark'))
    .toBe(true);
  await expect
    .poll(() => batches.flat().some((event) => event.type === 'pwacn-feel'))
    .toBe(true);
  await page.getByRole('button', { name: 'Open test controls' }).tap();
  await page.getByRole('button', { name: 'Finish' }).tap();
  await page.locator('input[type=file]').setInputFiles({
    name: 'phone.mov',
    mimeType: 'video/quicktime',
    buffer: Buffer.from('test video'),
  });
  await expect(page.getByText('Recording received')).toBeVisible();
  expect(uploaded).toBe(true);
});
