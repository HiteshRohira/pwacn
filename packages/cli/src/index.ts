import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

type Config = { components: string; installed: Record<string, string> };
const builtRegistry = resolve(dirname(fileURLToPath(import.meta.url)), 'registry');
const sourceRegistry = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '../../../registry',
);
const registryRoot = existsSync(builtRegistry) ? builtRegistry : sourceRegistry;
const cwd = process.cwd();
const configPath = join(cwd, 'pwacn.json');

const components: Record<string, { file: string; dependencies: string[] }> = {
  pressable: { file: 'pressable.tsx', dependencies: [] },
  sheet: { file: 'sheet.tsx', dependencies: ['pressable'] },
  'swipe-action': { file: 'swipe-action.tsx', dependencies: [] },
  stack: { file: 'stack.tsx', dependencies: [] },
};

const hash = (source: string) =>
  createHash('sha256').update(source).digest('hex').slice(0, 12);

async function readConfig(): Promise<Config> {
  if (!existsSync(configPath)) throw new Error('Run `pwacn init` first.');
  return JSON.parse(await readFile(configPath, 'utf8')) as Config;
}

async function init() {
  if (existsSync(configPath)) return console.log('pwacn is already initialized.');
  const config: Config = { components: 'src/components/pwacn', installed: {} };
  await writeFile(configPath, `${JSON.stringify(config, null, 2)}\n`);
  console.log('Created pwacn.json');
}

async function install(name: string, config: Config, seen = new Set<string>()) {
  if (seen.has(name)) return;
  const component = components[name];
  if (!component)
    throw new Error(
      `Unknown component "${name}". Available: ${Object.keys(components).join(', ')}`,
    );
  seen.add(name);
  for (const dependency of component.dependencies)
    await install(dependency, config, seen);
  const source = await readFile(join(registryRoot, name, component.file), 'utf8');
  const destination = join(cwd, config.components, component.file);
  await mkdir(dirname(destination), { recursive: true });
  if (existsSync(destination)) console.log(`Updating ${destination}`);
  await writeFile(destination, source);
  config.installed[name] = hash(source);
  console.log(`Added ${name}`);
}

async function add(names: string[]) {
  const config = await readConfig();
  for (const name of names) await install(name, config);
  await writeFile(configPath, `${JSON.stringify(config, null, 2)}\n`);
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

const [, , command, ...args] = process.argv;
const run =
  command === 'init'
    ? init()
    : command === 'add'
      ? add(args)
      : command === 'diff'
        ? diff(args[0])
        : Promise.reject(new Error('Usage: pwacn <init|add|diff>'));
run.catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
