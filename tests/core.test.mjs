import test from 'node:test';
import assert from 'node:assert/strict';
import { analyze, search, placements, candidate, FIELDS } from '../public/core.js';

const golden = { huaLuStar: 6, redLuan: 9, zuoFu: 9, wenChang: 4, ziWei: 3, sanTai: 1 };

test('Golden Test 與 iOS 相同，唯一庚午六月十七午時火六局', () => {
  assert.deepEqual(search(golden), [candidate(6, 6, 17, 6)]);
  assert.deepEqual(candidate(6, 6, 17, 6), { id: 27918, year: 6, month: 6, day: 17, hour: 6, mingPalace: 1, shenPalace: 1, bureau: 6 });
});
test('未知條件保留所有合法且排序的 259,200 組', () => {
  const all = search({});
  assert.equal(all.length, 259200);
  assert.ok(all.every((c, index) => c.id === index));
  assert.equal(search({ huaLuStar: 6 }).length, 25920);
  assert.equal(search({ redLuan: 9 }).length, 21600);
  assert.equal(search({ huaLuStar: 6, redLuan: 9 }).length, 4320);
  assert.equal(search({ huaLuStar: 0, redLuan: 2 }).length, 0);
});
test('多解及 entropy 推薦不強制合併', () => {
  const query = { ...golden }; delete query.sanTai;
  const result = analyze(query);
  assert.deepEqual(result.candidates.map(c => c.day), [12, 17, 27]);
  assert.equal(result.recommendations[0].field, 'sanTai');
  assert.equal(result.recommendations[0].distinctValues, 3);
  assert.ok(Math.abs(result.recommendations[0].entropy - Math.log2(3)) < 1e-10);
});
test('每個進階條件皆精確比對', () => {
  const c = candidate(6, 6, 17, 6), p = placements(c);
  for (const { key } of FIELDS.slice(6)) {
    assert.deepEqual(search({ ...golden, [key]: p[key] }), [c]);
    assert.equal(search({ ...golden, [key]: (p[key] + 1) % 12 }).length, 0);
  }
});
test('火鈴的候選數與原版相同', () => {
  assert.equal(search({ huoXing: 7 }).length, 21600);
  assert.equal(search({ huoXing: 7, lingXing: 9 }).length, 5400);
});
test('無解逐一移除條件診斷，多重矛盾不錯誤歸因', () => {
  const result = analyze({ ...golden, sanTai: 2 });
  assert.equal(result.count, 0);
  assert.deepEqual(new Set(result.conflicts.map(c => c.field)), new Set(['huaLuStar', 'wenChang', 'ziWei', 'sanTai']));
  assert.equal(result.conflicts.find(c => c.field === 'sanTai').restoredCount, 3);
  assert.deepEqual(analyze({ redLuan: 9, zuoFu: 9, wenChang: 4, youBi: 6, wenQu: 0, tianXi: 9 }).conflicts, []);
});
test('超過 200 組不傳送大量候選給畫面', () => {
  const result = analyze({ redLuan: 9 });
  assert.equal(result.count, 21600);
  assert.deepEqual(result.candidates, []);
  assert.ok(result.recommendations.length > 0);
});
test('拒絕範圍外的條件與不合法的出生組合', () => {
  for (const query of [{ huaLuStar: 10 }, { mingPalace: -1 }, { ziWei: '3' }, { other: 0 }]) assert.throws(() => search(query));
  for (const values of [[60, 1, 1, 0], [0, 0, 1, 0], [0, 1, 31, 0], [0, 1, 1, 12]]) assert.throws(() => candidate(...values));
});
