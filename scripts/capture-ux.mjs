import { mkdir, writeFile } from 'node:fs/promises';
import { chromium, devices } from '@playwright/test';

const target = process.env.PWACN_UX_URL ?? 'http://127.0.0.1:4174';
const stamp = new Date().toISOString().replaceAll(':', '-').replaceAll('.', '-');
const artifactDir = `.ux-artifacts/runs/${stamp}`;
await mkdir(artifactDir, { recursive: true });
const browser = await chromium.launch({ headless: true });
const results = [];

async function capture(name, exercise, options = {}) {
  const started = performance.now();
  const context = await browser.newContext({
    ...devices['iPhone 15 Pro'],
    ...options,
    recordVideo: { dir: artifactDir, size: { width: 393, height: 852 } },
  });
  const page = await context.newPage();
  const video = page.video();
  try {
    await page.goto(target, { waitUntil: 'networkidle' });
    await exercise(page);
    await page.screenshot({ path: `${artifactDir}/${name}.png` });
    results.push({
      name,
      status: 'passed',
      durationMs: Math.round(performance.now() - started),
    });
  } catch (error) {
    results.push({
      name,
      status: 'failed',
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  } finally {
    await context.close();
    await video?.saveAs(`${artifactDir}/${name}.webm`);
    await video?.delete();
  }
}

await capture('settings-navigation', async (page) => {
  await page.getByRole('switch', { name: 'Airplane Mode' }).tap();
  await page.waitForTimeout(350);
  await page.getByRole('button', { name: /Wi-Fi Off/ }).tap();
  await page.waitForTimeout(700);
  await page.getByRole('switch', { name: 'Wi-Fi' }).tap();
  await page.waitForTimeout(350);
  await page.getByRole('button', { name: /Settings/ }).tap();
  await page.waitForTimeout(700);
});

await capture('settings-search', async (page) => {
  const search = page.getByPlaceholder('Search');
  await search.fill('privacy');
  await page.waitForTimeout(500);
  await page.getByRole('button', { name: /Privacy & Security/ }).tap();
  await page.waitForTimeout(700);
});

await capture('settings-account-sheet', async (page) => {
  await page.getByRole('button', { name: /Hitesh Kumar/ }).tap();
  await page.waitForTimeout(650);
  await page.getByRole('button', { name: /Personal Information/ }).tap();
  await page
    .getByRole('dialog', { name: 'Account actions' })
    .waitFor({ state: 'visible' });
  await page.waitForTimeout(650);
  await page.getByRole('button', { name: 'Cancel' }).tap();
  await page.waitForTimeout(500);
});

await capture(
  'settings-dark-mode',
  async (page) => {
    await page.getByRole('button', { name: /Display & Brightness/ }).tap();
    await page.waitForTimeout(650);
    await page.getByRole('button', { name: 'Dark' }).tap();
    await page.waitForTimeout(500);
  },
  { colorScheme: 'dark' },
);

await writeFile(
  `${artifactDir}/audit.json`,
  `${JSON.stringify({ target, capturedAt: new Date().toISOString(), results }, null, 2)}\n`,
);
await browser.close();
console.log(artifactDir);
