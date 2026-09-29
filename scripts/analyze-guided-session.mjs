import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const directory = process.argv[2];
if (!directory) {
  console.error('Usage: node scripts/analyze-guided-session.mjs <session directory>');
  process.exit(1);
}

const readLines = (name) => {
  try {
    return readFileSync(join(directory, name), 'utf8')
      .split('\n')
      .filter(Boolean)
      .map((line) => JSON.parse(line));
  } catch {
    return [];
  }
};
const events = readLines('events.ndjson').sort((a, b) => a.epoch - b.epoch);
const prompts = readLines('prompts.ndjson');
const taps = events.filter((event) => event.type === 'pointerup');
const marks = events.filter((event) => event.type === 'user-mark');
const motionTypes = new Set([
  'animationstart',
  'animationend',
  'transitionrun',
  'transitionend',
  'scroll',
]);

const targetName = (event) =>
  event.target?.label ||
  event.target?.role ||
  event.target?.className?.split(' ')[0] ||
  event.target?.tag ||
  'unknown';
const near = (a, b, radius = 48) =>
  Math.hypot((a.x ?? 0) - (b.x ?? 0), (a.y ?? 0) - (b.y ?? 0)) <= radius;
const activePrompt = (epoch) =>
  [...prompts].reverse().find((prompt) => prompt.sentAt <= epoch)?.text ?? '';
const responseAfter = (tap) =>
  events.filter((event) => {
    if (event.epoch < tap.epoch || event.epoch > tap.epoch + 800) return false;
    if (motionTypes.has(event.type)) return true;
    if (event.type !== 'dom-change') return false;
    return event.attribute !== 'data-pressed';
  });

const noResponse = taps
  .filter((tap) => responseAfter(tap).length === 0)
  .map((tap) => ({
    epoch: tap.epoch,
    x: tap.x,
    y: tap.y,
    target: targetName(tap),
    prompt: activePrompt(tap.epoch),
  }));

const doubleTaps = [];
for (let i = 1; i < taps.length; i += 1) {
  const first = taps[i - 1];
  const second = taps[i];
  if (second.epoch - first.epoch > 360 || !near(first, second)) continue;
  doubleTaps.push({
    epoch: second.epoch,
    x: second.x,
    y: second.y,
    target: targetName(second),
    prompt: activePrompt(second.epoch),
    responseEvents: responseAfter(second).map((event) => event.type),
  });
}

const repeatedTaps = [];
for (let i = 2; i < taps.length; i += 1) {
  const group = taps.slice(i - 2, i + 1);
  if (group[2].epoch - group[0].epoch > 1600) continue;
  if (!near(group[0], group[1]) || !near(group[1], group[2])) continue;
  if (repeatedTaps.some((item) => item.epoch === group[1].epoch)) continue;
  repeatedTaps.push({
    epoch: group[1].epoch,
    x: group[1].x,
    y: group[1].y,
    target: targetName(group[1]),
    prompt: activePrompt(group[1].epoch),
  });
}

const summary = {
  eventCount: events.length,
  prompts,
  issueMarks: marks.map((mark) => ({
    epoch: mark.epoch,
    prompt: activePrompt(mark.epoch),
  })),
  pointerEvents: events.filter((event) => event.type.startsWith('pointer')).length,
  feelSamples: events.filter((event) => event.type === 'pwacn-feel').length,
  possibleNoResponse: noResponse,
  doubleTaps,
  repeatedTaps,
  note: 'These are timing heuristics, not confirmed bugs. Compare with the recording and source.',
};
const output = join(directory, 'analysis.json');
writeFileSync(output, JSON.stringify(summary, null, 2));
console.log(JSON.stringify(summary, null, 2));
console.log('\nSaved ' + output);
