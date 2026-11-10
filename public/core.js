// Formulas ported from Sources/ZiWeiCore/Rules/DefaultRuleSet.swift.
export const BRANCHES = [...'子丑寅卯辰巳午未申酉戌亥'];
export const STEMS = [...'甲乙丙丁戊己庚辛壬癸'];
export const STARS = ['廉貞', '天機', '天同', '太陰', '貪狼', '武曲', '太陽', '巨門', '天梁', '破軍'];
export const FIELDS = [
  ['huaLuStar', '生年化祿'], ['redLuan', '紅鸞'], ['zuoFu', '左輔'], ['wenChang', '文昌'],
  ['ziWei', '紫微'], ['sanTai', '三台'], ['mingPalace', '命宮'], ['shenPalace', '身宮'],
  ['youBi', '右弼'], ['wenQu', '文曲'], ['tianXi', '天喜'], ['baZuo', '八座'],
  ['enGuang', '恩光'], ['tianGui', '天貴'], ['huoXing', '火星'], ['lingXing', '鈴星'],
].map(([key, label]) => ({ key, label }));
export const MONTHS = ['正月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'];
export const DAYS = ['初一', '初二', '初三', '初四', '初五', '初六', '初七', '初八', '初九', '初十', '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十', '廿一', '廿二', '廿三', '廿四', '廿五', '廿六', '廿七', '廿八', '廿九', '三十'];
export const BUREAUS = { 2: '水二局', 3: '木三局', 4: '金四局', 5: '土五局', 6: '火六局' };
export const mod = (n, base = 12) => ((n % base) + base) % base;
export const yearName = index => STEMS[index % 10] + BRANCHES[index % 12];
export const summary = c => `${yearName(c.year)}年 農曆${MONTHS[c.month - 1]}${DAYS[c.day - 1]} ${BRANCHES[c.hour]}時`;
export function hourRange(hour) {
  if (hour === 0) return '約 23:00～翌日 01:00';
  return `約 ${String(hour * 2 - 1).padStart(2, '0')}:00～${String(hour * 2 + 1).padStart(2, '0')}:00`;
}
export function palaceStem(year, palace) {
  return ((year % 10 % 5) * 2 + 2 + mod(palace - 2)) % 10;
}
export function candidate(year, month, day, hour) {
  if (![year, month, day, hour].every(Number.isInteger) || year < 0 || year > 59 || month < 1 || month > 12 || day < 1 || day > 30 || hour < 0 || hour > 11) throw new RangeError('出生組合超出範圍');
  const mingPalace = mod(1 + month - hour);
  const stem = palaceStem(year, mingPalace);
  const sum = (Math.floor(stem / 2) + Math.floor(mingPalace % 6 / 2) + 1) % 5;
  return { id: year * 4320 + (month - 1) * 360 + (day - 1) * 12 + hour,
    year, month, day, hour, mingPalace, shenPalace: mod(1 + month + hour), bureau: [3, 4, 2, 6, 5][sum] };
}
function fromID(id) {
  return candidate(Math.floor(id / 4320), Math.floor(id % 4320 / 360) + 1, Math.floor(id % 360 / 12) + 1, id % 12);
}
export function placements(c) {
  const { year, month, day, hour, bureau, mingPalace, shenPalace } = c;
  const branch = year % 12, zuo = mod(3 + month), you = mod(11 - month);
  const chang = mod(10 - hour), qu = mod(4 + hour);
  const multiplier = Math.ceil(day / bureau), difference = multiplier * bureau - day;
  return {
    huaLuStar: year % 10, redLuan: mod(3 - branch), zuoFu: zuo, wenChang: chang,
    ziWei: mod(1 + multiplier + (difference % 2 === 0 ? difference : -difference)),
    sanTai: mod(zuo + day - 1), mingPalace, shenPalace, youBi: you, wenQu: qu,
    tianXi: mod(9 - branch), baZuo: mod(you - day + 1), enGuang: mod(chang + day - 2),
    tianGui: mod(qu + day - 2), huoXing: mod([2, 3, 1, 9][branch % 4] + hour),
    lingXing: mod((branch % 4 === 2 ? 3 : 10) + hour),
  };
}
let table;
function getTable() {
  if (!table) {
    table = new Uint8Array(259200 * FIELDS.length);
    for (let id = 0; id < 259200; id++) {
      const p = placements(fromID(id));
      FIELDS.forEach(({ key }, index) => { table[id * 16 + index] = p[key]; });
    }
  }
  return table;
}
function matchingIDs(query) {
  const filters = [];
  for (const [key, value] of Object.entries(query)) {
    const index = FIELDS.findIndex(f => f.key === key);
    if (index === -1 || !Number.isInteger(value) || value < 0 || value >= (index === 0 ? 10 : 12)) throw new RangeError('無效的反查條件');
    filters.push([index, value]);
  }
  const data = getTable(), ids = [];
  outer: for (let id = 0; id < 259200; id++) {
    for (const [index, value] of filters) if (data[id * 16 + index] !== value) continue outer;
    ids.push(id);
  }
  return ids;
}
export function search(query) { return matchingIDs(query).map(fromID); }
export function analyze(query) {
  const ids = matchingIDs(query), count = ids.length, data = getTable();
  const recommendations = [], conflicts = [];
  if (count > 1) FIELDS.forEach(({ key }, index) => {
    if (query[key] !== undefined) return;
    const histogram = new Uint32Array(12);
    for (const id of ids) histogram[data[id * 16 + index]]++;
    const counts = [...histogram].filter(Boolean);
    if (counts.length > 1) recommendations.push({ field: key, index, distinctValues: counts.length,
      entropy: counts.reduce((sum, n) => sum - n / count * Math.log2(n / count), 0) });
  });
  recommendations.sort((a, b) => Math.abs(a.entropy - b.entropy) < 1e-10 ? a.index - b.index : b.entropy - a.entropy);
  if (count === 0) FIELDS.forEach(({ key }, index) => {
    if (query[key] === undefined) return;
    const reduced = { ...query }; delete reduced[key];
    const restoredCount = matchingIDs(reduced).length;
    if (restoredCount > 0) conflicts.push({ field: key, index, restoredCount });
  });
  conflicts.sort((a, b) => a.restoredCount - b.restoredCount || a.index - b.index);
  return { count, candidates: count <= 200 ? ids.map(fromID) : [], recommendations: recommendations.slice(0, 3), conflicts };
}
