import test from 'node:test';
import assert from 'node:assert/strict';
import { gregorianDates, validateYears, defaultYears } from '../public/calendar.js';
import { candidate, mod } from '../public/core.js';

const birth = (year, month, day) => candidate(mod(year - 1984, 60), month, day, 0);
test('Golden Test 及六十年循環、閏月雙日期', () => {
  assert.deepEqual(gregorianDates(candidate(6, 6, 17, 6), 1980, 2000).map(d => d.date), ['1990/08/07']);
  const dates = gregorianDates(candidate(6, 6, 17, 6), 1930, 1990);
  assert.deepEqual(dates.map(d => d.lunarYear), [1930, 1930, 1990]);
  assert.deepEqual(dates.map(d => d.isLeapMonth), [false, true, false]);
  assert.deepEqual(gregorianDates(birth(2023, 2, 1), 2023, 2023).map(d => [d.date, d.isLeapMonth]), [['2023/02/20', false], ['2023/03/22', true]]);
});
test('農曆年跨西元年、小月不存在的三十日不挪到下個月', () => {
  assert.deepEqual(gregorianDates(birth(2024, 12, 29), 2024, 2024).map(d => d.date), ['2025/01/28']);
  assert.deepEqual(gregorianDates(birth(2024, 1, 1), 2024, 2024).map(d => d.date), ['2024/02/10']);
  assert.deepEqual(gregorianDates(birth(2024, 1, 30), 2024, 2024), []);
  assert.deepEqual(gregorianDates(birth(1990, 6, 17), 1980, 1989), []);
});
test('驗證年份，非法輸入不作換算', () => {
  for (const [start, end] of [['', '2026'], ['2000.5', '2026'], ['2026', '2000'], ['0', '2026'], ['1900', '9999'], ['1e3', '2026']]) {
    assert.ok(validateYears(start, end));
  }
  assert.equal(validateYears('1', '9998'), '');
  assert.throws(() => gregorianDates(birth(2024, 1, 1), 2025, 2024));
  assert.deepEqual(defaultYears(new Date('2026-12-31T16:00:00Z')), [1967, 2027]);
});
