import { createHash } from 'node:crypto';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { chromium, webkit, devices } from '@playwright/test';

const dist = new URL('../apps/kitchen-sink/dist/', import.meta.url).pathname;
const manifest = JSON.parse(await readFile(join(dist, 'offline-assets.json'), 'utf8'));
const originalSW = await readFile(join(dist, 'sw.js'), 'utf8');
const files = new Map(
  await Promise.all(
    manifest.assets.map(async ({ url }) => [url, await readFile(join(dist, url))]),
  ),
);
let sw = originalSW;
let failAsset = null;
let networkDown = false;
const server = createServer(async (request, response) => {
  const path = new URL(request.url, 'http://localhost').pathname;
  if (networkDown) {
    response.statusCode = 503;
    response.end('Simulated network outage');
    return;
  }
  if (path === '/sw.js') {
    response.setHeader('Content-Type', 'text/javascript');
    response.setHeader('Cache-Control', 'no-store');
    response.end(sw);
    return;
  }
  if (path === failAsset) {
    response.statusCode = 503;
    response.end('Simulated incomplete download');
    return;
  }
  const file = files.get(path === '/' ? '/index.html' : path);
  if (!file) {
    response.statusCode = 404;
    response.end('Missing');
    return;
  }
  response.setHeader(
    'Content-Type',
    path.endsWith('.js')
      ? 'text/javascript'
      : path.endsWith('.css')
        ? 'text/css'
        : path.endsWith('.svg')
          ? 'image/svg+xml'
          : path.endsWith('.webmanifest')
            ? 'application/manifest+json'
            : path.endsWith('.html') || path === '/'
              ? 'text/html'
              : 'image/png',
  );
  response.end(file);
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const url = `http://127.0.0.1:${server.address().port}/`;
const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};
const waitReady = async (page) =>
  page.getByText('Ready offline', { exact: true }).waitFor({ timeout: 15000 });
const engines = [
  { name: 'Chromium/Android', type: chromium, device: devices['Pixel 7'] },
  { name: 'WebKit/iPhone', type: webkit, device: devices['iPhone 15 Pro'] },
];
try {
  for (const engine of engines) {
    const browser = await engine.type.launch();
    try {
      // A failed first install must not report ready or keep a partial cache.
      failAsset = '/icon-512.png';
      const incompleteContext = await browser.newContext(engine.device);
      const incompletePage = await incompleteContext.newPage();
      await incompletePage.goto(url);
      await incompletePage
        .getByText('Offline copy unavailable', { exact: true })
        .waitFor({ timeout: 15000 });
      const partialCaches = await incompletePage.evaluate(() => globalThis.caches.keys());
      assert(
        partialCaches.length === 0,
        `${engine.name}: incomplete first install left a cache`,
      );
      failAsset = null;
      await incompleteContext.close();
      console.log(`${engine.name}: incomplete first install passed`);
      const context = await browser.newContext(engine.device);
      const page = await context.newPage();
      await page.goto(url);
      await waitReady(page);
      const count = await page.evaluate(async () => {
        const cache = await globalThis.caches.open(
          (await globalThis.caches.keys()).find((key) => key.startsWith('pwacn-static-')),
        );
        return (await cache.keys()).length;
      });
      assert(
        count === manifest.assets.length,
        `${engine.name}: fresh install cached ${count}/${manifest.assets.length}`,
      );
      if (engine.name.startsWith('WebKit')) networkDown = true;
      else await context.setOffline(true);
      await page.close();
      const cold = await context.newPage();
      await cold.goto(url, { waitUntil: 'domcontentloaded' });
      assert(
        (await cold.getByRole('heading', { name: 'Settings' }).count()) === 1,
        `${engine.name}: offline cold launch failed`,
      );
      const labels = [
        'Wi-Fi',
        'Bluetooth',
        'Mobile Service',
        'Personal Hotspot',
        'Battery',
        'General',
        'Accessibility',
        'Action Button',
        'Camera',
        'Control Centre',
        'Display & Brightness',
        'Home Screen & App Library',
        'Search',
        'StandBy',
        'Wallpaper',
        'Notifications',
        'Sounds & Haptics',
        'Focus',
        'Screen Time',
        'Siri',
        'Face ID & Passcode',
        'Emergency SOS',
        'Exposure Notifications',
        'Privacy & Security',
        'Game Center',
        'iCloud',
        'Wallet & Apple Pay',
        'Apps',
        'Developer',
      ];
      for (const label of labels) {
        await cold
          .getByRole('button', {
            name: new RegExp(`^${label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`),
          })
          .first()
          .evaluate((node) => node.click());
        await cold.getByRole('heading', { name: label, exact: true }).waitFor();
        await cold
          .getByRole('button', { name: /Settings/ })
          .first()
          .evaluate((node) => node.click());
        await cold.getByRole('heading', { name: 'Settings', exact: true }).waitFor();
      }
      await cold
        .getByRole('button', { name: /General/ })
        .first()
        .evaluate((node) => node.click());
      await cold
        .getByRole('button', { name: /Software Update/ })
        .first()
        .evaluate((node) => node.click());
      await cold.getByRole('heading', { name: 'Software Update' }).waitFor();
      if (engine.name.startsWith('WebKit')) networkDown = false;
      else await context.setOffline(false);
      await cold.close();
      console.log(
        `${engine.name}: fresh install, offline cold launch, all root screens, nested screen passed`,
      );

      // A failed new install must leave the previous complete cache and controller intact.
      const updatedIcon = Buffer.concat([
        files.get('/icon.svg'),
        Buffer.from('\n<!-- offline update -->\n'),
      ]);
      const oldJs = manifest.assets.find((asset) => asset.url.endsWith('.js'));
      const updatedJsUrl = oldJs.url.replace(/\.js$/, '-updated.js');
      const updatedHtml = Buffer.from(
        files.get('/index.html').toString().replace(oldJs.url, updatedJsUrl),
      );
      const updatedAssets = manifest.assets.map((asset) => {
        if (asset.url === '/icon.svg')
          return {
            ...asset,
            sha256: createHash('sha256').update(updatedIcon).digest('hex'),
          };
        if (asset.url === oldJs.url) return { ...asset, url: updatedJsUrl };
        if (asset.url === '/index.html')
          return {
            ...asset,
            sha256: createHash('sha256').update(updatedHtml).digest('hex'),
          };
        return asset;
      });
      const updateId = createHash('sha256')
        .update(JSON.stringify(updatedAssets))
        .digest('hex')
        .slice(0, 16);
      sw = originalSW
        .replace(/^const BUILD = .*;$/m, `const BUILD = ${JSON.stringify(updateId)};`)
        .replace(
          /^const ASSETS = .*;$/m,
          `const ASSETS = ${JSON.stringify(updatedAssets)};`,
        );
      files.set('/icon.svg', updatedIcon);
      files.set('/index.html', updatedHtml);
      files.set(updatedJsUrl, files.get(oldJs.url));
      failAsset = '/icon.svg';
      const updatePage = await context.newPage();
      await updatePage.goto(url);
      await updatePage.evaluate(async () =>
        (await navigator.serviceWorker.getRegistration()).update(),
      );
      await updatePage.waitForTimeout(1500);
      const afterFailure = await updatePage.evaluate(async () => ({
        controller: navigator.serviceWorker.controller?.scriptURL,
        caches: await globalThis.caches.keys(),
      }));
      assert(
        afterFailure.caches.includes(`pwacn-static-${manifest.buildId}`),
        `${engine.name}: previous build lost during incomplete update`,
      );
      assert(
        !afterFailure.caches.includes(`pwacn-static-${updateId}`),
        `${engine.name}: incomplete update cache survived`,
      );
      failAsset = null;
      await updatePage.evaluate(async () =>
        (await navigator.serviceWorker.getRegistration()).update(),
      );
      await updatePage.waitForFunction(
        (id) =>
          navigator.serviceWorker.controller &&
          globalThis.caches.keys().then((keys) => keys.includes(`pwacn-static-${id}`)),
        updateId,
        { timeout: 15000 },
      );
      const cachesAfterUpdate = await updatePage.evaluate(() => globalThis.caches.keys());
      assert(
        cachesAfterUpdate.includes(`pwacn-static-${manifest.buildId}`),
        `${engine.name}: previous complete build not retained`,
      );
      if (engine.name.startsWith('WebKit')) networkDown = true;
      else await context.setOffline(true);
      const oldChunk = await updatePage.evaluate(async (path) => {
        const response = await fetch(path, { cache: 'reload' });
        return { ok: response.ok, type: response.headers.get('content-type') };
      }, oldJs.url);
      assert(
        oldChunk.ok && oldChunk.type?.includes('javascript'),
        `${engine.name}: previous build chunk unavailable offline after update`,
      );
      if (engine.name.startsWith('WebKit')) networkDown = false;
      else await context.setOffline(false);
      console.log(
        `${engine.name}: incomplete update, coherent update, old-chunk compatibility passed`,
      );

      // Eviction while offline shows a truthful recovery page. Online re-download restores readiness.
      await updatePage.evaluate(async () => {
        for (const key of await globalThis.caches.keys())
          await globalThis.caches.delete(key);
      });
      if (engine.name.startsWith('WebKit')) networkDown = true;
      else await context.setOffline(true);
      await updatePage.close();
      const lost = await context.newPage();
      await lost.goto(url);
      assert(
        (await lost
          .getByRole('heading', { name: 'Offline copy unavailable' })
          .count()) === 1,
        `${engine.name}: cache loss did not show recovery`,
      );
      if (engine.name.startsWith('WebKit')) networkDown = false;
      else await context.setOffline(false);
      await lost.reload();
      await waitReady(lost).catch(async (error) => {
        console.log(
          'recovery diagnostics',
          engine.name,
          await lost
            .locator('[data-pwacn-offline-status]')
            .textContent()
            .catch(() => 'no status'),
          await lost.evaluate(async () => ({
            caches: await globalThis.caches.keys(),
            controller: navigator.serviceWorker.controller?.scriptURL,
          })),
        );
        throw error;
      });
      console.log(`${engine.name}: cache-loss recovery passed`);
      await context.close();
    } finally {
      await browser.close();
    }
    networkDown = false;
    sw = originalSW;
    files.set('/icon.svg', await readFile(join(dist, 'icon.svg')));
    files.set('/index.html', await readFile(join(dist, 'index.html')));
    for (const path of [...files.keys()])
      if (path.endsWith('-updated.js')) files.delete(path);
  }
} finally {
  await new Promise((resolve) => server.close(resolve));
}
