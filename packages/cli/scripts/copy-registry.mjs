import { cp, rm } from 'node:fs/promises';
import { resolve } from 'node:path';

const source = resolve(import.meta.dirname, '../../../registry');
const destination = resolve(import.meta.dirname, '../dist/registry');

await rm(destination, { recursive: true, force: true });
await cp(source, destination, { recursive: true });
