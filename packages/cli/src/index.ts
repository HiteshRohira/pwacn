import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export type Config = {
  schemaVersion: 1;
  components: string;
  installed: Record<string, string>;
};
const builtRegistry = resolve(dirname(fileURLToPath(import.meta.url)), 'registry');
const sourceRegistry = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '../../../registry',
);
const registryRoot = existsSync(builtRegistry) ? builtRegistry : sourceRegistry;
const cwd = process.cwd();
const configPath = join(cwd, 'pwacn.json');

export const components: Record<string, { file: string; dependencies: string[] }> = {
  pressable: { file: 'pressable.tsx', dependencies: [] },
  sheet: { file: 'sheet.tsx', dependencies: ['pressable'] },
  'action-sheet': { file: 'action-sheet.tsx', dependencies: ['sheet'] },
  'swipe-action': { file: 'swipe-action.tsx', dependencies: [] },
  stack: { file: 'stack.tsx', dependencies: [] },
  switch: { file: 'switch.tsx', dependencies: ['pressable'] },
  'segmented-control': { file: 'segmented-control.tsx', dependencies: ['pressable'] },
  tabs: { file: 'tabs.tsx', dependencies: [] },
  'navigation-bar': { file: 'navigation-bar.tsx', dependencies: [] },
  'context-menu': { file: 'context-menu.tsx', dependencies: ['action-sheet'] },
  picker: { file: 'picker.tsx', dependencies: [] },
  toast: { file: 'toast.tsx', dependencies: [] },
  'refresh-control': { file: 'refresh-control.tsx', dependencies: [] },
  'reorderable-list': { file: 'reorderable-list.tsx', dependencies: [] },
  carousel: { file: 'carousel.tsx', dependencies: [] },
};

export const hash = (source: string) =>
  createHash('sha256').update(source).digest('hex').slice(0, 12);

async function readConfig(): Promise<Config> {
  if (!existsSync(configPath)) throw new Error('Run `pwacn init` first.');
  const config = JSON.parse(await readFile(configPath, 'utf8')) as Partial<Config>;
  return {
    schemaVersion: 1,
    components: config.components ?? 'src/components/pwacn',
    installed: config.installed ?? {},
  };
}

async function init() {
  if (existsSync(configPath)) return console.log('pwacn is already initialized.');
  const config: Config = {
    schemaVersion: 1,
    components: 'src/components/pwacn',
    installed: {},
  };
  await writeFile(configPath, `${JSON.stringify(config, null, 2)}\n`);
  console.log('Created pwacn.json');
}

async function install(
  name: string,
  config: Config,
  force: boolean,
  seen = new Set<string>(),
) {
  if (seen.has(name)) return;
  const component = components[name];
  if (!component)
    throw new Error(
      `Unknown component "${name}". Available: ${Object.keys(components).join(', ')}`,
    );
  seen.add(name);
  for (const dependency of component.dependencies)
    await install(dependency, config, force, seen);
  const source = await readFile(join(registryRoot, name, component.file), 'utf8');
  const destination = join(cwd, config.components, component.file);
  await mkdir(dirname(destination), { recursive: true });
  if (existsSync(destination)) {
    const local = await readFile(destination, 'utf8');
    const installedHash = config.installed[name];
    if (!force && installedHash && hash(local) !== installedHash)
      throw new Error(`${name} has local changes. Re-run with --force to overwrite it.`);
    console.log(`Updating ${destination}`);
  }
  await writeFile(destination, source);
  config.installed[name] = hash(source);
  console.log(`Added ${name}`);
}

async function add(names: string[]) {
  const config = await readConfig();
  const force = names.includes('--force');
  const requested = names.filter((name) => name !== '--force');
  if (!requested.length) throw new Error('Pass at least one component name.');
  const seen = new Set<string>();
  for (const name of requested) await install(name, config, force, seen);
  await writeFile(configPath, `${JSON.stringify(config, null, 2)}\n`);
}

async function list() {
  const config = existsSync(configPath) ? await readConfig() : null;
  for (const name of Object.keys(components).sort())
    console.log(`${config?.installed[name] ? '✓' : '·'} ${name}`);
}

async function doctor() {
  const config = await readConfig();
  let issues = 0;
  for (const name of Object.keys(config.installed)) {
    const component = components[name];
    if (!component || !existsSync(join(cwd, config.components, component.file))) {
      issues += 1;
      console.log(`missing: ${name}`);
    }
  }
  if (issues)
    throw new Error(`Found ${issues} registry issue${issues === 1 ? '' : 's'}.`);
  console.log(`pwacn is healthy (${Object.keys(config.installed).length} components).`);
}

async function diff(name?: string) {
  const config = await readConfig();
  const names = name ? [name] : Object.keys(config.installed);
  for (const current of names) {
    const component = components[current];
    if (!component) continue;
    const localPath = join(cwd, config.components, component.file);
    const registrySource = await readFile(
      join(registryRoot, current, component.file),
      'utf8',
    );
    const localSource = existsSync(localPath) ? await readFile(localPath, 'utf8') : '';
    console.log(
      `${current}: ${hash(localSource) === hash(registrySource) ? 'up to date' : 'modified'}`,
    );
  }
}

export async function run(argv = process.argv.slice(2)) {
  const [command, ...args] = argv;
  if (command === 'init') return init();
  if (command === 'add') return add(args);
  if (command === 'diff') return diff(args[0]);
  if (command === 'list') return list();
  if (command === 'doctor') return doctor();
  throw new Error('Usage: pwacn <init|add|diff|list|doctor>');
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url))
  run().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
