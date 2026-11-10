import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { candidate, placements, FIELDS } from '../public/core.js';

const expected = readFileSync(new URL('../../.build/web-parity/swift.bin', import.meta.url));
assert.equal(expected.length, 259200 * 17);
let offset = 0;
for (let year = 0; year < 60; year++) for (let month = 1; month <= 12; month++) {
  for (let day = 1; day <= 30; day++) for (let hour = 0; hour < 12; hour++) {
    const c = candidate(year, month, day, hour), values = placements(c);
    for (const { key } of FIELDS) assert.equal(values[key], expected[offset++], `${c.id} ${key}`);
    assert.equal(c.bureau, expected[offset++], `${c.id} bureau`);
  }
}
console.log('Swift ↔ Web：259,200 組 × 16 欄位及五行局，4,406,400 個值全部一致。');
