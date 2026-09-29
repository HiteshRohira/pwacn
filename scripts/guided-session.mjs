import { createServer } from 'node:http';
import { randomBytes } from 'node:crypto';
import {
  createWriteStream,
  mkdirSync,
  writeFileSync,
  appendFileSync,
  copyFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawn } from 'node:child_process';
import { createInterface } from 'node:readline';

const port = Number(process.env.PWACN_GUIDED_PORT || 7337);
const id = randomBytes(6).toString('hex');
const token = randomBytes(24).toString('hex');
const directory = join(tmpdir(), 'pwacn-guided', id);
mkdirSync(directory, { recursive: true });
const eventsPath = join(directory, 'events.ndjson');
const promptsPath = join(directory, 'prompts.ndjson');
const sessionPath = join(directory, 'session.json');
let prompt = { sequence: 0, text: '' };
let eventCount = 0;
let relay = null;
let videoPath = null;
let tunnel = null;
const startedAt = new Date().toISOString();

const metadata = () =>
  writeFileSync(
    sessionPath,
    JSON.stringify(
      { id, startedAt, relay, eventCount, prompt, video: videoPath },
      null,
      2,
    ),
  );
metadata();

const allowedOrigins = new Set([
  'https://pwacn-settings.vercel.app',
  'http://127.0.0.1:4174',
  'http://localhost:4174',
  'http://localhost:5173',
]);

function respond(request, response, code, data) {
  const origin = request.headers.origin;
  if (allowedOrigins.has(origin)) {
    response.setHeader('Access-Control-Allow-Origin', origin);
    response.setHeader('Vary', 'Origin');
  }
  response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  response.setHeader('Cache-Control', 'no-store');
  response.writeHead(code, { 'Content-Type': 'application/json' });
  response.end(JSON.stringify(data));
}

function authorized(url) {
  return (
    url.searchParams.get('session') === id && url.searchParams.get('token') === token
  );
}

function readJson(request) {
  return new Promise((resolve, reject) => {
    let body = '';
    request.on('data', (chunk) => {
      body += chunk;
      if (body.length > 256_000) {
        reject(new Error('Event batch exceeds 256 KB'));
        request.destroy();
      }
    });
    request.on('end', () => {
      try {
        resolve(JSON.parse(body));
      } catch {
        reject(new Error('Invalid JSON'));
      }
    });
    request.on('error', reject);
  });
}

const server = createServer(async (request, response) => {
  const url = new URL(request.url || '/', 'http://localhost');
  if (request.method === 'OPTIONS') return respond(request, response, 204, {});
  if (!authorized(url))
    return respond(request, response, 403, { error: 'Invalid session' });
  if (request.method === 'GET' && url.pathname === '/api/prompt')
    return respond(request, response, 200, prompt);
  if (request.method === 'POST' && url.pathname === '/api/events') {
    try {
      const body = await readJson(request);
      if (!Array.isArray(body.events) || body.events.length > 500)
        return respond(request, response, 400, { error: 'Invalid event batch' });
      for (const event of body.events) {
        if (!event || typeof event !== 'object') continue;
        appendFileSync(
          eventsPath,
          JSON.stringify({ ...event, receivedAt: Date.now() }) + '\n',
        );
        eventCount += 1;
      }
      metadata();
      return respond(request, response, 200, { received: body.events.length });
    } catch (error) {
      return respond(request, response, 400, { error: String(error) });
    }
  }
  if (request.method === 'POST' && url.pathname === '/api/video') {
    const length = Number(request.headers['content-length'] || 0);
    if (!length || length > 500_000_000)
      return respond(request, response, 413, { error: 'Video must be under 500 MB' });
    const path = join(directory, 'phone-recording.mov');
    const stream = createWriteStream(path, { flags: 'w' });
    request.pipe(stream);
    stream.on('finish', () => {
      videoPath = path;
      metadata();
      respond(request, response, 200, { saved: path });
    });
    stream.on('error', () => respond(request, response, 500, { error: 'Upload failed' }));
    return;
  }
  respond(request, response, 404, { error: 'Not found' });
});

function showLink() {
  if (!relay) return;
  const link = new URL('https://pwacn-settings.vercel.app/instagram');
  link.searchParams.set('guided', '1');
  link.searchParams.set('relay', relay);
  link.searchParams.set('session', id);
  link.searchParams.set('token', token);
  console.log('\nOpen on the iPhone:\n' + link.toString());
  console.log('\nSession files: ' + directory);
  console.log(
    'Commands: prompt <instruction>, attach <recording path>, status, stop, help\n',
  );
}

function startTunnel() {
  tunnel = spawn('cloudflared', ['tunnel', '--url', `http://127.0.0.1:${port}`], {
    stdio: ['ignore', 'ignore', 'pipe'],
  });
  tunnel.stderr.setEncoding('utf8');
  tunnel.stderr.on('data', (chunk) => {
    const match = chunk.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/);
    if (match && !relay) {
      relay = match[0];
      metadata();
      showLink();
    }
  });
  tunnel.on('error', (error) => {
    console.error('Tunnel unavailable:', error.message);
    console.error(
      'Run with PWACN_GUIDED_RELAY=<HTTPS relay URL> if using another tunnel.',
    );
  });
}

function command(input) {
  const line = input.trim();
  if (line.startsWith('prompt ')) {
    prompt = { sequence: prompt.sequence + 1, text: line.slice(7).trim() };
    appendFileSync(promptsPath, JSON.stringify({ ...prompt, sentAt: Date.now() }) + '\n');
    metadata();
    console.log(`Sent prompt #${prompt.sequence}: ${prompt.text}`);
  } else if (line.startsWith('attach ')) {
    try {
      const source = line.slice(7).trim();
      const destination = join(directory, 'wired-recording.mov');
      copyFileSync(source, destination);
      videoPath = destination;
      metadata();
      console.log('Attached recording: ' + destination);
    } catch (error) {
      console.error('Could not attach recording:', error.message);
    }
  } else if (line === 'status') {
    console.log({ id, eventCount, prompt, directory, relay, videoPath });
  } else if (line === 'help') {
    console.log('prompt <instruction> | attach <recording path> | status | stop');
  } else if (line === 'stop') {
    tunnel?.kill('SIGTERM');
    server.close();
    metadata();
    console.log('Session saved in ' + directory);
    process.exit(0);
  } else if (line) console.log('Unknown command. Type help.');
}

server.listen(port, '127.0.0.1', () => {
  console.log(`Guided session ${id} listening on 127.0.0.1:${port}`);
  relay = process.env.PWACN_GUIDED_RELAY || null;
  if (relay) showLink();
  else startTunnel();
});
createInterface({ input: process.stdin, output: process.stdout, terminal: true }).on(
  'line',
  command,
);
