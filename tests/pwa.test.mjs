import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

async function serviceWorkerHarness() {
  const scope = 'https://example.com/ziwei/', events = new Map(), storage = new Map();
  const bucket = () => ({
    files: new Map(),
    async addAll(files) {
      for (const request of files) {
        const name = './' + new URL(request.url).pathname.slice(new URL(scope).pathname.length);
        assert.equal(request.cache, 'reload');
        const content = await readFile(new URL(`../public/${name === './' ? 'index.html' : name.slice(2)}`, import.meta.url));
        this.files.set(new URL(name, scope).href, { ok: true, body: content.toString() });
      }
    },
    async match(request) { return this.files.get(typeof request === 'string' ? new URL(request, scope).href : request.url); },
  });
  const caches = { async open(key) { if (!storage.has(key)) storage.set(key, bucket()); return storage.get(key); }, async keys() { return [...storage.keys()]; }, async delete(key) { return storage.delete(key); } };
  let skipped = false, claimed = false, offline = true;
  const self = { registration: { scope }, location: { origin: 'https://example.com' },
    clients: { async claim() { claimed = true; } }, skipWaiting() { skipped = true; }, addEventListener(name, callback) { events.set(name, callback); } };
  const context = vm.createContext({ self, caches, URL, Request, fetch: async () => { if (offline) throw new Error('offline'); return { ok: true, body: 'network' }; } });
  vm.runInContext(await readFile(new URL('../public/sw.js', import.meta.url), 'utf8'), context);
  return { events, storage, setOnline() { offline = false; }, get skipped() { return skipped; }, get claimed() { return claimed; } };
}
test('PWA 安裝的每一項資源都存在，子路徑離線導覽與 worker 模組可從快取取回', async () => {
  const h = await serviceWorkerHarness();
  let pending; h.events.get('install')({ waitUntil(promise) { pending = promise; } }); await pending;
  assert.equal(h.storage.size, 1);
  let response;
  const request = (path, mode) => h.events.get('fetch')({ request: { method: 'GET', url: `https://example.com/ziwei/${path}`, mode }, respondWith(promise) { response = promise; } });
  request('', 'navigate'); assert.match((await response).body, /<title>紫微反查<\/title>/);
  request('worker.js', 'same-origin'); assert.match((await response).body, /self.onmessage/);
  request('core.js', 'same-origin'); assert.match((await response).body, /function analyze/);
  // Until an update is accepted, HTML and modules must come from the same release.
  h.setOnline(); request('', 'navigate'); assert.match((await response).body, /<title>紫微反查<\/title>/);
});
test('更新只清除本 App 本 scope 的舊版本，等待使用者觸發更新', async () => {
  const h = await serviceWorkerHarness(); let pending;
  h.events.get('install')({ waitUntil(promise) { pending = promise; } }); await pending;
  assert.equal(h.skipped, false);
  h.storage.set('ziwei:https://example.com/ziwei/:old', {});
  h.storage.set('ziwei:https://example.com/other/:v1', {});
  h.storage.set('another-app', {});
  h.events.get('activate')({ waitUntil(promise) { pending = promise; } }); await pending;
  assert.equal(h.storage.has('ziwei:https://example.com/ziwei/:old'), false);
  assert.equal(h.storage.has('ziwei:https://example.com/other/:v1'), true);
  assert.equal(h.storage.has('another-app'), true); assert.equal(h.claimed, true);
  h.events.get('message')({ data: 'SKIP_WAITING' }); assert.equal(h.skipped, true);
});
