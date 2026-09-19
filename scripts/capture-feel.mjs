import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { chromium, devices } from '@playwright/test';

const target = process.env.PWACN_FEEL_URL ?? 'http://127.0.0.1:4173';
const manifest = JSON.parse(
  await readFile('ux-research/scenarios/bottom-sheet.json', 'utf8'),
);
const stamp = new Date().toISOString().replaceAll(':', '-').replaceAll('.', '-');
const artifactDir = `.ux-artifacts/feel/${stamp}`;
await mkdir(artifactDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const audit = [];

for (const scenario of manifest.scenarios) {
  const context = await browser.newContext({
    ...devices['iPhone 15 Pro'],
    recordVideo: { dir: artifactDir, size: manifest.viewport },
  });
  const page = await context.newPage();
  const video = page.video();
  const started = performance.now();
  let status = 'passed';
  let error;
  try {
    await page.goto(`${target}/feel/sheet?scenario=${scenario.id}`, {
      waitUntil: 'networkidle',
    });
    await page.getByRole('button', { name: /Replay exact trace/ }).click();
    await page.getByRole('dialog').waitFor({ state: 'visible' });
    await page.waitForFunction(
      () =>
        globalThis.__PWACN_FEEL__?.samples.some((sample) => sample.state === 'complete'),
      undefined,
      { timeout: 7000 },
    );
    const telemetry = await page.evaluate(() => globalThis.__PWACN_FEEL__);
    if (!telemetry || telemetry.samples.length < 3)
      throw new Error('Telemetry did not record enough motion samples');
    if (!telemetry.samples.some((sample) => sample.state === 'releasing'))
      throw new Error('Release handoff was not recorded');
    if (
      scenario.id === 'interrupt-settle' &&
      !telemetry.samples.some((sample) => sample.state === 'interrupted')
    )
      throw new Error('Settle animation was not interrupted by the second gesture');
    await page.screenshot({ path: `${artifactDir}/${scenario.id}.png`, fullPage: true });
    await writeFile(
      `${artifactDir}/${scenario.id}.telemetry.json`,
      `${JSON.stringify(telemetry, null, 2)}\n`,
    );
    await writeFile(
      `${artifactDir}/${scenario.id}.review.md`,
      `# ${scenario.label}\n\n${scenario.intent}\n\n## Invariants\n\n${scenario.invariants.map((item) => `- ${item}`).join('\n')}\n\n## Automated summary\n\n\`\`\`json\n${JSON.stringify(telemetry.summary, null, 2)}\n\`\`\`\n`,
    );
  } catch (caught) {
    status = 'failed';
    error = caught instanceof Error ? caught.message : String(caught);
  } finally {
    await context.close();
    await video?.saveAs(`${artifactDir}/${scenario.id}.webm`);
    await video?.delete();
  }
  audit.push({
    scenario: scenario.id,
    status,
    durationMs: Math.round(performance.now() - started),
    ...(error ? { error } : {}),
  });
}

await writeFile(
  `${artifactDir}/audit.json`,
  `${JSON.stringify({ target, capturedAt: new Date().toISOString(), audit }, null, 2)}\n`,
);
await browser.close();

if (audit.some((result) => result.status === 'failed')) {
  console.error(artifactDir);
  process.exitCode = 1;
} else {
  console.log(artifactDir);
}
