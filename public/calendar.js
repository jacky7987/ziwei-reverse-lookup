import { mod } from './core.js';

export function validateYears(start, end) {
  if (![start, end].every(value => /^\d{1,4}$/.test(String(value)) && Number(value) >= 1 && Number(value) <= 9998)) return '請輸入 1～9998 之間的完整西元年份。';
  if (Number(start) > Number(end)) return '起始年份不能大於結束年份。';
  return '';
}
export function defaultYears(now = new Date()) {
  const year = Number(new Intl.DateTimeFormat('en', { timeZone: 'Asia/Taipei', year: 'numeric' }).format(now));
  return [Math.max(1, year - 60), year];
}
let formatter;
export function lunarParts(date) {
  formatter ??= new Intl.DateTimeFormat('en-US-u-ca-chinese-nu-latn', { timeZone: 'Asia/Taipei', year: 'numeric', month: 'numeric', day: 'numeric' });
  if (formatter.resolvedOptions().calendar !== 'chinese') throw new Error('這個瀏覽器不支援農曆換算，請更新 Safari 或 Chrome。');
  const parts = Object.fromEntries(formatter.formatToParts(date).map(p => [p.type, p.value]));
  if (!parts.relatedYear || !/^\d+(bis)?$/.test(parts.month)) throw new Error('瀏覽器的農曆資料格式不受支援。');
  return { year: Number(parts.relatedYear), month: parseInt(parts.month, 10), day: Number(parts.day), isLeapMonth: parts.month.endsWith('bis') };
}
function noon(year, month, day) {
  const date = new Date(0);
  date.setUTCFullYear(year, month - 1, day);
  date.setUTCHours(4, 0, 0, 0); // Noon Asia/Taipei; never an inferred birth minute.
  return date;
}
const cache = new Map();
function lunarYearDates(year) {
  if (cache.has(year)) return cache.get(year);
  const dates = new Map(), end = noon(year + 1, 3, 1).getTime();
  for (let time = noon(year, 1, 1).getTime(); time < end; time += 86400000) {
    const civil = new Date(time), lunar = lunarParts(civil);
    if (lunar.year !== year) continue;
    const key = `${lunar.month}-${lunar.day}`;
    const date = `${String(civil.getUTCFullYear()).padStart(4, '0')}/${String(civil.getUTCMonth() + 1).padStart(2, '0')}/${String(civil.getUTCDate()).padStart(2, '0')}`;
    if (!dates.has(key)) dates.set(key, []);
    dates.get(key).push({ date, lunarYear: year, isLeapMonth: lunar.isLeapMonth });
  }
  cache.set(year, dates);
  return dates;
}
export function gregorianDates(c, start, end) {
  const error = validateYears(start, end);
  if (error) throw new RangeError(error);
  const results = [];
  const first = Number(start) + mod(c.year - mod(Number(start) - 1984, 60), 60);
  for (let year = first; year <= Number(end); year += 60) {
    results.push(...(lunarYearDates(year).get(`${c.month}-${c.day}`) ?? []).map(date => ({ ...date, hour: c.hour })));
  }
  return results;
}
