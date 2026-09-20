import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { chromium, devices } from '@playwright/test';

const target = process.env.PWACN_FEEL_URL ?? 'http://127.0.0.1:4173';
const suiteDefinitions = [
  { slug: 'sheet', file: 'bottom-sheet.json' },
  { slug: 'press', file: 'pressable.json' },
  { slug: 'interactive-back', file: 'interactive-back.json' },
];
const suites = await Promise.all(
  suiteDefinitions.map(async (suite) => ({
    ...suite,
    manifest: JSON.parse(await readFile(`ux-research/scenarios/${suite.file}`, 'utf8')),
  })),
);
const stamp = new Date().toISOString().replaceAll(':', '-').replaceAll('.', '-');
const artifactDir = `.ux-artifacts/feel/${stamp}`;
await mkdir(artifactDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const audit = [];

for (const { slug, manifest } of suites) {
  for (const scenario of manifest.scenarios) {
    const artifactName = `${slug}-${scenario.id}`;
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
      await page.goto(`${target}/feel/${slug}?scenario=${scenario.id}`, {
        waitUntil: 'networkidle',
      });
      await page.getByRole('button', { name: /Replay exact trace/ }).click();
      await page.waitForFunction(
        () => {
          const button = globalThis.document.querySelector('.replay-trace');
          return button instanceof globalThis.HTMLButtonElement && !button.disabled;
        },
        undefined,
        { timeout: 7000 },
      );
      const telemetry = await page.evaluate(() => globalThis.__PWACN_FEEL__);
      if (!telemetry || telemetry.samples.length < 3)
        throw new Error('Telemetry did not record enough motion samples');
      const states = new Set(telemetry.samples.map((sample) => sample.state));
      const requiredStates =
        manifest.primitive === 'Pressable'
          ? ['contact', 'responding']
          : manifest.primitive === 'InteractiveBack'
            ? ['contact', 'dragging', 'releasing']
            : ['dragging', 'releasing'];
      for (const state of requiredStates) {
        if (!states.has(state))
          throw new Error(`Required ${state} state was not recorded`);
      }
      if (scenario.id === 'interrupt-settle' && !states.has('interrupted'))
        throw new Error('Settle animation was not interrupted by the second gesture');
      if (
        manifest.primitive === 'InteractiveBack' &&
        ['slow-commit', 'fast-flick'].includes(scenario.id) &&
        !states.has('route-commit')
      )
        throw new Error('Interactive back did not commit the route');
      await page.screenshot({
        path: `${artifactDir}/${artifactName}.png`,
        fullPage: true,
      });
      await writeFile(
        `${artifactDir}/${artifactName}.telemetry.json`,
        `${JSON.stringify(telemetry, null, 2)}\n`,
      );
      await writeFile(
        `${artifactDir}/${artifactName}.review.md`,
        `# ${manifest.primitive}: ${scenario.label}\n\n${scenario.intent}\n\n## Invariants\n\n${scenario.invariants.map((item) => `- ${item}`).join('\n')}\n\n## Automated summary\n\n\`\`\`json\n${JSON.stringify(telemetry.summary, null, 2)}\n\`\`\`\n`,
      );
    } catch (caught) {
      status = 'failed';
      error = caught instanceof Error ? caught.message : String(caught);
    } finally {
      await context.close();
      await video?.saveAs(`${artifactDir}/${artifactName}.webm`);
      await video?.delete();
    }
    audit.push({
      primitive: manifest.primitive,
      scenario: scenario.id,
      status,
      durationMs: Math.round(performance.now() - started),
      ...(error ? { error } : {}),
    });
  }
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
