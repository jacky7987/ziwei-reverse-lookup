import test from 'node:test';
import assert from 'node:assert/strict';
import { Worker } from 'node:worker_threads';

test('背景運算保留請求編號、日期錯誤不刪除核心候選', async () => {
  const worker = new Worker(new URL('./node-worker.mjs', import.meta.url));
  try {
    const result = await new Promise((resolve, reject) => {
      worker.once('message', resolve); worker.once('error', reject);
      worker.postMessage({ id: 42, query: { huaLuStar: 6, redLuan: 9, zuoFu: 9, wenChang: 4, ziWei: 3, sanTai: 1 }, start: '2026', end: '1980' });
    });
    assert.equal(result.id, 42); assert.equal(result.count, 1);
    assert.equal(result.candidates[0].day, 17);
    assert.equal(result.calendarError, '起始年份不能大於結束年份。');
  } finally { await worker.terminate(); }
});
