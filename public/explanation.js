import { FIELDS, BRANCHES, STARS, STEMS, MONTHS, DAYS, BUREAUS, placements, palaceStem } from './core.js';

export function explanation(c, query) {
  const p = placements(c), steps = [], branch = BRANCHES[c.year % 12];
  const direct = ['huaLuStar', 'redLuan', 'tianXi', 'zuoFu', 'youBi', 'wenChang', 'wenQu', 'huoXing', 'lingXing'];
  for (const { key, label } of FIELDS) {
    if (query[key] === undefined || !direct.includes(key)) continue;
    let detail;
    if (key === 'huaLuStar') detail = `${STEMS[c.year % 10]}年 → ${STARS[p[key]]}化祿`;
    else {
      let origin = `${BRANCHES[c.hour]}時`;
      if (['redLuan', 'tianXi'].includes(key)) origin = `${branch}年`;
      if (['zuoFu', 'youBi'].includes(key)) origin = `農曆${MONTHS[c.month - 1]}`;
      if (['huoXing', 'lingXing'].includes(key)) origin = `${branch}年＋${BRANCHES[c.hour]}時`;
      detail = `${origin} → ${label}在${BRANCHES[p[key]]}`;
    }
    steps.push({ title: label, detail });
  }
  steps.push({ title: '命宮與身宮', detail: `農曆${MONTHS[c.month - 1]}＋${BRANCHES[c.hour]}時 → 命宮${BRANCHES[c.mingPalace]}，身宮${BRANCHES[c.shenPalace]}` });
  steps.push({ title: '五行局', detail: `${STEMS[c.year % 10]}年＋命宮${BRANCHES[c.mingPalace]} → ${STEMS[palaceStem(c.year, c.mingPalace)]}${BRANCHES[c.mingPalace]} → ${BUREAUS[c.bureau]}` });
  const origins = { ziWei: BUREAUS[c.bureau], sanTai: `左輔${BRANCHES[p.zuoFu]}`, baZuo: `右弼${BRANCHES[p.youBi]}`, enGuang: `文昌${BRANCHES[p.wenChang]}`, tianGui: `文曲${BRANCHES[p.wenQu]}` };
  for (const { key, label } of FIELDS) {
    if (query[key] !== undefined && origins[key]) steps.push({ title: label, detail: `${origins[key]}＋${DAYS[c.day - 1]}日 → ${label}在${BRANCHES[p[key]]}` });
  }
  return steps;
}
