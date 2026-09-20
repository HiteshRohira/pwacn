import { readdir, readFile, writeFile } from 'node:fs/promises';
import { basename, resolve } from 'node:path';

const [baselineArgument, candidateArgument] = process.argv.slice(2);
if (!baselineArgument || !candidateArgument) {
  console.error('Usage: pnpm feel:compare <baseline-run-dir> <candidate-run-dir>');
  process.exit(1);
}

const baselineDir = resolve(baselineArgument);
const candidateDir = resolve(candidateArgument);
const metrics = [
  'eventToCommitMs',
  'meanTrackingErrorPx',
  'p95TrackingErrorPx',
  'releaseVelocityPxPerSec',
  'animationInitialVelocityPxPerSec',
  'velocityContinuity',
  'settleTimeMs',
  'longFrames',
  'interruptions',
];

async function loadRun(directory) {
  const files = (await readdir(directory)).filter((file) =>
    file.endsWith('.telemetry.json'),
  );
  return new Map(
    await Promise.all(
      files.map(async (file) => [
        file.replace('.telemetry.json', ''),
        JSON.parse(await readFile(resolve(directory, file), 'utf8')),
      ]),
    ),
  );
}

const baseline = await loadRun(baselineDir);
const candidate = await loadRun(candidateDir);
const scenarios = [...candidate.keys()]
  .filter((scenario) => baseline.has(scenario))
  .sort();
if (!scenarios.length) throw new Error('The runs have no matching telemetry scenarios');

const value = (input) =>
  typeof input === 'number'
    ? Number.isInteger(input)
      ? String(input)
      : input.toFixed(2)
    : '—';
const rows = [];
for (const scenario of scenarios) {
  for (const metric of metrics) {
    const before = baseline.get(scenario)?.summary?.[metric];
    const after = candidate.get(scenario)?.summary?.[metric];
    const delta =
      typeof before === 'number' && typeof after === 'number' ? after - before : null;
    rows.push(
      `| ${scenario} | ${metric} | ${value(before)} | ${value(after)} | ${delta == null ? '—' : `${delta >= 0 ? '+' : ''}${value(delta)}`} |`,
    );
  }
}

const report = `# Feel run comparison\n\nBaseline: \`${basename(baselineDir)}\`  \nCandidate: \`${basename(candidateDir)}\`\n\n| Scenario | Metric | Baseline | Candidate | Δ |\n| --- | --- | ---: | ---: | ---: |\n${rows.join('\n')}\n\n> A delta is evidence, not a quality verdict. Review paired video at normal speed and frame-by-frame before accepting a change.\n`;
await writeFile(resolve(candidateDir, 'comparison.md'), report);
console.log(report);
