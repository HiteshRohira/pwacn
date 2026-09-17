import { mkdir } from 'node:fs/promises';
import { chromium, devices } from '@playwright/test';

const output = '.ux-artifacts/release';
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  ...devices['iPhone 15 Pro'],
  recordVideo: { dir: output, size: { width: 393, height: 852 } },
});
const page = await context.newPage();
const video = page.video();

await page.goto('http://127.0.0.1:4173', { waitUntil: 'networkidle' });
await page.getByRole('radio', { name: 'Surface' }).tap();
await page.waitForTimeout(450);
await page.getByRole('button', { name: /Open multi-snap sheet/ }).tap();
await page.waitForTimeout(900);
await page.screenshot({ path: `${output}/playground.png` });
await page.keyboard.press('Escape');
await page.waitForTimeout(600);

await page.goto('http://127.0.0.1:4174', { waitUntil: 'networkidle' });
await page.getByRole('button', { name: /General/ }).tap();
await page.waitForTimeout(650);
await page.getByRole('button', { name: /Software Update/ }).tap();
await page.waitForTimeout(650);
await page.goBack();
await page.waitForTimeout(500);
await page.goBack();
await page.waitForTimeout(500);
await page.getByRole('button', { name: /Display & Brightness/ }).tap();
await page.waitForTimeout(600);
await page.getByRole('button', { name: 'Dark' }).tap();
await page.waitForTimeout(700);
await page.screenshot({ path: `${output}/settings-dark.png` });
await page.goBack();
await page.waitForTimeout(500);
await page.getByRole('button', { name: /Hitesh Kumar/ }).tap();
await page.waitForTimeout(600);
await page.getByRole('button', { name: /Personal Information/ }).tap();
await page.waitForTimeout(900);
await page.screenshot({ path: `${output}/settings-sheet.png` });
await page.keyboard.press('Escape');
await page.waitForTimeout(500);

await context.close();
await video?.saveAs(`${output}/pwacn-v0.1-demo.webm`);
await video?.delete();
await browser.close();
console.log(`${output}/pwacn-v0.1-demo.webm`);
