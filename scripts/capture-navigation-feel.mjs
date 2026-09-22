import { execFile } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { promisify } from 'node:util';
import { chromium, devices, webkit } from '@playwright/test';

const run = promisify(execFile);
const target = process.env.PWACN_UX_URL ?? 'http://127.0.0.1:4174';
const stamp = new Date().toISOString().replaceAll(':', '-').replaceAll('.', '-');
const artifactDir = `.ux-artifacts/navigation/${stamp}`;
const repetitions = Number(process.env.PWACN_FEEL_REPETITIONS ?? 3);
await mkdir(artifactDir, { recursive: true });

const scenarios = [
  {
    id: 'slow-commit',
    path: ['Personal Hotspot'],
    points: [0, 82, 172, 278],
    delay: 140,
    commits: true,
  },
  {
    id: 'fast-flick',
    path: ['Personal Hotspot'],
    points: [0, 24, 52, 96],
    delay: 20,
    commits: true,
  },
  {
    id: 'slow-cancel',
    path: ['Personal Hotspot'],
    points: [0, 38, 76, 102],
    delay: 160,
    commits: false,
  },
  {
    id: 'reverse-cancel',
    path: ['Personal Hotspot'],
    points: [0, 120, 180, 72],
    delay: 130,
    commits: false,
  },
  {
    id: 'nested-commit',
    path: ['General', 'Software Update'],
    points: [0, 82, 172, 278],
    delay: 140,
    commits: true,
  },
  {
    id: 'scrolled-commit',
    path: ['General'],
    points: [0, 82, 172, 278],
    delay: 140,
    commits: true,
    scroll: true,
  },
];

const engines = [
  { name: 'chromium-android', browserType: chromium, device: devices['Pixel 7'] },
  { name: 'webkit-iphone', browserType: webkit, device: devices['iPhone 15 Pro'] },
];

function analyze(scenario, trace) {
  const states = trace.telemetry.map((sample) => sample.state);
  const count = (state) => states.filter((candidate) => candidate === state).length;
  const release = trace.positions.findIndex((point) => point.phase === 'released');
  const afterRelease = release < 0 ? [] : trace.positions.slice(release);
  const connected = afterRelease.filter((point) => point.connected);
  const backwardJumps = connected
    .slice(1)
    .filter((point, index) => point.x < connected[index].x - 2);
  const discontinuities = connected
    .slice(1)
    .filter((point, index) => Math.abs(point.x - connected[index].x) > 90);
  const errors = [];
  const paired = trace.positions.filter(
    (point) =>
      point.connected &&
      point.backgroundConnected &&
      point.phase === 'dragging' &&
      point.x > 12,
  );
  const stationaryBackground = paired.filter(
    (point) => Math.abs(point.backgroundX - trace.initialBackgroundX) < 2,
  );
  const couplingErrors = paired.filter(
    (point) =>
      Math.abs(point.backgroundX - (trace.initialBackgroundX + point.x * 0.24)) > 12,
  );
  const releaseSample = trace.telemetry.find((sample) => sample.state === 'releasing');
  const completeSample = trace.telemetry.find((sample) => sample.state === 'complete');
  const settleTimeMs =
    releaseSample && completeSample
      ? completeSample.timestamp - releaseSample.timestamp
      : null;
  for (const required of ['contact', 'responding', 'dragging', 'releasing'])
    if (!states.includes(required)) errors.push(`missing ${required}`);
  if (count('releasing') !== 1)
    errors.push(`releasing occurred ${count('releasing')} times`);
  if (scenario.commits && count('route-commit') !== 1)
    errors.push(`route-commit occurred ${count('route-commit')} times`);
  if (!scenario.commits && count('route-commit') !== 0)
    errors.push('cancel committed a route');
  if (scenario.commits && backwardJumps.length)
    errors.push('rendered surface moved backwards after commit');
  if (discontinuities.length)
    errors.push('rendered surface jumped more than 90px between frames');
  if (paired.length < (scenario.id === 'fast-flick' ? 1 : 3))
    errors.push('insufficient paired foreground/background frames');
  if (stationaryBackground.length > 2)
    errors.push('background remained stationary while foreground moved');
  if (couplingErrors.length > 2)
    errors.push('foreground and background did not follow one progress value');
  if (scenario.commits !== trace.didNavigate)
    errors.push('route outcome did not match the scenario');
  return {
    passed: errors.length === 0,
    errors,
    states,
    settleTimeMs,
    backwardJumps: backwardJumps.length,
    discontinuities: discontinuities.length,
    stationaryBackgroundFrames: stationaryBackground.length,
    couplingErrors: couplingErrors.length,
  };
}

const audit = [];
for (const engine of engines) {
  const browser = await engine.browserType.launch({ headless: true });
  for (const scenario of scenarios) {
    for (let repetition = 1; repetition <= repetitions; repetition += 1) {
      const name = `${engine.name}-${scenario.id}-run-${repetition}`;
      const context = await browser.newContext({
        ...engine.device,
        recordVideo: { dir: artifactDir, size: { width: 393, height: 852 } },
      });
      const page = await context.newPage();
      const video = page.video();
      let trace;
      let result;
      try {
        await page.addInitScript(() => {
          globalThis.__pwacnSamples = [];
          globalThis.window.addEventListener('pwacn:feel', (event) => {
            if (
              event instanceof CustomEvent &&
              event.detail?.primitive === 'InteractiveBack'
            )
              globalThis.__pwacnSamples.push(event.detail);
          });
        });
        await page.goto(target, { waitUntil: 'networkidle' });
        for (const label of scenario.path) {
          await page.getByRole('button', { name: new RegExp(label) }).tap();
          await page.waitForTimeout(800);
        }
        if (scenario.scroll)
          await page.locator('.detail-scroll').evaluate((node) => {
            node.scrollTop = 280;
          });
        const beforeHeading = await page
          .getByRole('heading', { level: 1 })
          .last()
          .textContent();
        trace = await page
          .locator('[data-pwacn-back-surface]')
          .last()
          .evaluate(
            async (node, input) => {
              globalThis.__pwacnSamples = [];
              const box = node.getBoundingClientRect();
              const positions = [];
              const background = node.previousElementSibling;
              const stackBox = node.parentElement.getBoundingClientRect();
              const initialBackgroundX =
                background?.getBoundingClientRect().left - stackBox.left;
              let phase = 'dragging';
              let sampling = true;
              const sample = (timestamp) => {
                const rect = node.getBoundingClientRect();
                positions.push({
                  timestamp,
                  x: rect.left - box.left,
                  connected: node.isConnected,
                  backgroundConnected: Boolean(background?.isConnected),
                  backgroundX: background?.getBoundingClientRect().left - stackBox.left,
                  phase,
                });
                if (sampling) globalThis.requestAnimationFrame(sample);
              };
              globalThis.requestAnimationFrame(sample);
              const y = box.top + box.height * 0.45;
              const startX = box.left + box.width * 0.48;
              const send = (type, x, buttons) =>
                node.dispatchEvent(
                  new globalThis.PointerEvent(type, {
                    bubbles: true,
                    cancelable: true,
                    pointerId: 741,
                    pointerType: 'touch',
                    isPrimary: true,
                    button: 0,
                    buttons,
                    clientX: x,
                    clientY: y,
                  }),
                );
              send('pointerdown', startX, 1);
              for (const dx of input.points.slice(1)) {
                await new Promise((resolve) => setTimeout(resolve, input.delay));
                send('pointermove', startX + dx, 1);
              }
              await new Promise((resolve) =>
                globalThis.requestAnimationFrame(() => resolve()),
              );
              phase = 'released';
              send('pointerup', startX + input.points.at(-1), 0);
              await new Promise((resolve) => setTimeout(resolve, 1600));
              sampling = false;
              return {
                positions,
                initialBackgroundX,
                telemetry: globalThis.__pwacnSamples,
              };
            },
            { points: scenario.points, delay: scenario.delay },
          );
        const afterHeading = await page
          .getByRole('heading', { level: 1 })
          .last()
          .textContent();
        trace.didNavigate = beforeHeading !== afterHeading;
        result = analyze(scenario, trace);
        await page.screenshot({ path: `${artifactDir}/${name}.png` });
      } catch (error) {
        result = {
          passed: false,
          errors: [error instanceof Error ? error.message : String(error)],
        };
      } finally {
        await context.close();
        await video?.saveAs(`${artifactDir}/${name}.webm`);
        await video?.delete();
      }
      try {
        await run('ffmpeg', [
          '-y',
          '-i',
          `${artifactDir}/${name}.webm`,
          '-filter:v',
          'setpts=4*PTS',
          '-an',
          `${artifactDir}/${name}-slow.mp4`,
        ]);
      } catch (error) {
        result.passed = false;
        result.errors.push(
          `slow-motion render failed: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
      await writeFile(
        `${artifactDir}/${name}.json`,
        `${JSON.stringify({ scenario, trace, result }, null, 2)}\n`,
      );
      audit.push({ engine: engine.name, scenario: scenario.id, repetition, ...result });
    }
  }
  await browser.close();
}

for (const engine of engines) {
  for (const scenario of scenarios) {
    const runs = audit.filter(
      (entry) => entry.engine === engine.name && entry.scenario === scenario.id,
    );
    const settleTimes = runs
      .map((entry) => entry.settleTimeMs)
      .filter((value) => typeof value === 'number');
    if (
      settleTimes.length > 1 &&
      Math.max(...settleTimes) - Math.min(...settleTimes) > 150
    ) {
      for (const entry of runs) {
        entry.passed = false;
        entry.errors.push('settle time varied by more than 150ms across repetitions');
      }
    }
  }
}

await writeFile(
  `${artifactDir}/audit.json`,
  `${JSON.stringify({ target, capturedAt: new Date().toISOString(), audit }, null, 2)}\n`,
);
console.log(artifactDir);
if (audit.some((entry) => !entry.passed)) process.exitCode = 1;
