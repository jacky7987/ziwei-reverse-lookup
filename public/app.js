import { FIELDS, BRANCHES, STARS, BUREAUS, summary, hourRange } from './core.js';
import { defaultYears, validateYears } from './calendar.js';
import { explanation } from './explanation.js';

const $ = id => document.getElementById(id);
const number = value => value.toLocaleString('zh-TW');
const labelFor = key => FIELDS.find(f => f.key === key).label;
function node(tag, text, className) {
  const element = document.createElement(tag);
  if (text !== undefined) element.textContent = text;
  if (className) element.className = className;
  return element;
}
function button(text, action, className = 'text-button') {
  const element = node('button', text, className);
  element.type = 'button'; element.addEventListener('click', action);
  return element;
}
let query = {}, requestID = 0, timer, worker;
const selects = new Map();
for (const [index, { key, label }] of FIELDS.entries()) {
  const field = node('div', undefined, 'field'), title = node('label', label), select = node('select');
  title.htmlFor = key; select.id = key; select.name = key;
  select.append(new Option('不知道', ''));
  (index === 0 ? STARS : BRANCHES).forEach((value, i) => select.append(new Option(value, String(i))));
  select.addEventListener('change', () => {
    if (select.value === '') delete query[key]; else query[key] = Number(select.value);
    schedule();
  });
  field.append(title, select); selects.set(key, select);
  $(index < 6 ? 'basic-fields' : 'advanced-fields').append(field);
}
function syncConditions() {
  for (const [key, select] of selects) { select.value = query[key] === undefined ? '' : String(query[key]); select.classList.toggle('filled', select.value !== ''); }
  $('filled-count').textContent = `已填 ${Object.keys(query).length} 項`;
  const advanced = FIELDS.slice(6).filter(f => query[f.key] !== undefined).length;
  $('advanced-count').textContent = advanced ? `已填 ${advanced} 項` : '選填';
}
function setDefaultYears() {
  const [start, end] = defaultYears(); $('start-year').value = start; $('end-year').value = end;
}
function checkYears() {
  const start = $('start-year').value, end = $('end-year').value, error = validateYears(start, end);
  $('year-error').textContent = error; $('year-error').hidden = !error;
  for (const id of ['start-year', 'end-year']) $(id).setAttribute('aria-invalid', String(Boolean(error)));
  $('year-summary').textContent = error ? '請確認年份' : `${Number(start)}～${Number(end)}`;
}
function schedule() {
  const id = ++requestID; clearTimeout(timer); syncConditions(); checkYears();
  $('results').setAttribute('aria-busy', 'true'); $('result-tag').textContent = '更新中';
  $('live-status').textContent = '更新候選中…'; $('result-description').textContent = '正在比對目前條件…';
  for (const target of ['candidates', 'conflicts', 'recommendations']) $(target).replaceChildren();
  $('recommendations').hidden = true; $('runtime-error').hidden = true;
  timer = setTimeout(() => {
    if (worker) worker.postMessage({ id, query, start: $('start-year').value, end: $('end-year').value });
  }, 150);
}
function fatal(message) {
  $('results').setAttribute('aria-busy', 'false'); $('result-tag').textContent = '無法完成';
  $('result-count').textContent = '—'; $('result-description').textContent = '請重新載入頁面後再試一次。';
  $('runtime-error').textContent = message; $('runtime-error').hidden = false;
  $('live-status').textContent = '反查未完成';
}
function focusField(key) {
  if (FIELDS.findIndex(f => f.key === key) >= 6) $('advanced').open = true;
  const select = selects.get(key); select.focus(); select.scrollIntoView({ block: 'center' });
}
function render(result) {
  const { count, candidates, recommendations, conflicts, calendarError } = result;
  $('results').setAttribute('aria-busy', 'false'); $('result-count').textContent = number(count);
  const isEmpty = Object.keys(query).length === 0;
  $('result-tag').textContent = isEmpty ? '等待條件' : count === 0 ? '請核對條件' : count === 1 ? '唯一候選' : count > 200 ? '繼續縮小範圍' : '可核對日期';
  $('result-description').textContent = isEmpty ? '先選擇你知道的位置，從任何一項開始。' : count === 0 ? '目前沒有完全符合的組合，請核對下方提示。' : count > 200 ? '候選超過 200 組。補充幾個條件後，會自動顯示生日。' : count === 1 ? '找到一組完全符合的出生資料。' : '保留所有符合的組合，點開候選查看詳情。';
  $('live-status').textContent = `目前候選 ${number(count)} 組`;
  if (recommendations.length && !isEmpty) {
    const first = recommendations[0], box = $('recommendations'); box.hidden = false;
    box.append(node('p', '下一步建議', 'eyebrow'), button(`查看「${labelFor(first.field)}」的位置 →`, () => focusField(first.field), 'recommend-button'));
    if (recommendations.length > 1) box.append(node('p', `其次可查看：${recommendations.slice(1).map(r => labelFor(r.field)).join('、')}`));
  }
  if (count === 0) {
    const box = $('conflicts');
    box.append(node('p', conflicts.length ? '暫時移除以下條件，可恢復候選。這不代表該項一定填錯。' : '移除單一條件仍無法找到結果，請交叉確認多個位置與原命盤的安星規則。'));
    for (const conflict of conflicts) box.append(button(`移除「${labelFor(conflict.field)}」· 可恢復 ${number(conflict.restoredCount)} 組`, () => { delete query[conflict.field]; schedule(); }));
  }
  for (const c of candidates) renderCandidate(c, calendarError, candidates.length === 1);
}
function renderCandidate(c, calendarError, unique) {
  const item = node('details', undefined, 'candidate'); item.open = unique;
  const heading = node('summary'), title = node('span', summary(c), 'candidate-title');
  const dates = c.dates ?? [];
  const datePreview = dates.slice(0, 3).map(d => d.date + (d.isLeapMonth ? '（閏月）' : '')).join('、');
  title.append(node('span', calendarError ? '請確認西元日期設定' : dates.length ? `${datePreview}${dates.length > 3 ? ` 等 ${dates.length} 筆` : ''} · ${BRANCHES[c.hour]}時` : '指定年份內無對應日期', 'candidate-date'));
  heading.append(title); item.append(heading);
  // Build details on first expansion so even broad year ranges stay responsive.
  const populate = () => {
    if (!item.open || item.dataset.populated) return;
    item.dataset.populated = 'true'; item.append(candidateDetail(c, calendarError));
  };
  item.addEventListener('toggle', populate); populate(); $('candidates').append(item);
}
function candidateDetail(c, calendarError) {
  const detail = node('div', undefined, 'candidate-detail'), facts = node('dl', undefined, 'facts');
  for (const [key, value] of [['命宮', BRANCHES[c.mingPalace]], ['身宮', BRANCHES[c.shenPalace]], ['五行局', BUREAUS[c.bureau]]]) {
    const pair = node('div'); pair.append(node('dt', key), node('dd', value)); facts.append(pair);
  }
  detail.append(facts, node('p', `${BRANCHES[c.hour]}時 ${hourRange(c.hour)}`, 'secondary'));
  const dates = node('div', undefined, 'dates'); dates.append(node('h3', '西元日期可能值'));
  if (calendarError) dates.append(node('p', calendarError, 'error'));
  else if (!c.dates.length) dates.append(node('p', '此年份範圍內沒有對應日期。干支年可能不在範圍內，或該農曆月份沒有此日。', 'footnote'));
  else {
    for (const d of c.dates) {
      const row = node('p', undefined, 'date-row'); row.append(node('span', d.date), node('span', `${BRANCHES[c.hour]}時`));
      if (d.isLeapMonth) row.append(node('span', '閏月日期，原命盤排法待確認', 'leap-note'));
      dates.append(row);
    }
    dates.append(node('p', '保留同月序的普通月與閏月日期，仍需核對原命盤的閏月規則。', 'footnote'));
  }
  const copy = button('複製結果', async () => {
    try { await navigator.clipboard.writeText(copyText(c, calendarError)); copy.textContent = '已複製'; }
    catch { copy.textContent = '無法自動複製，請長按結果選取'; }
  }, 'copy-button');
  const why = node('details', undefined, 'explanation'); why.append(node('summary', '為什麼得到這個結果？'));
  const steps = node('ol');
  for (const step of explanation(c, query)) { const li = node('li', step.title); li.append(node('span', step.detail)); steps.append(li); }
  why.append(steps); detail.append(dates, copy, why); return detail;
}
function copyText(c, calendarError) {
  const lines = [summary(c), `命宮${BRANCHES[c.mingPalace]}，身宮${BRANCHES[c.shenPalace]}，${BUREAUS[c.bureau]}`, `${hourRange(c.hour)}；無法反推出精確出生分鐘。`, `農曆年份範圍：${$('start-year').value}～${$('end-year').value}`];
  if (calendarError) lines.push(`西元日期未換算：${calendarError}`);
  else if (!c.dates.length) lines.push('此年份範圍內沒有對應西元日期。');
  else for (const d of c.dates) lines.push(`${d.date} ${BRANCHES[c.hour]}時${d.isLeapMonth ? '（閏月曆法日期，原命盤排法待確認）' : ''}`);
  lines.push('閏月排法、子時換日及真太陽時需依原命盤確認。'); return lines.join('\n');
}
$('clear-button').addEventListener('click', () => { query = {}; setDefaultYears(); schedule(); });
$('example-button').addEventListener('click', () => {
  query = { huaLuStar: 6, redLuan: 9, zuoFu: 9, wenChang: 4, ziWei: 3, sanTai: 1 };
  $('start-year').value = '1980'; $('end-year').value = '2000'; schedule();
});
for (const id of ['start-year', 'end-year']) $(id).addEventListener('input', schedule);
$('help-button').addEventListener('click', () => $('help-dialog').showModal());
$('close-help').addEventListener('click', () => $('help-dialog').close());
try {
  worker = new Worker(new URL('./worker.js', import.meta.url), { type: 'module' });
  worker.onmessage = ({ data }) => { if (data.id === requestID) data.error ? fatal(data.error) : render(data); };
  worker.onerror = () => fatal('無法啟動背景運算。請使用新版 Safari 或 Chrome，並透過網站網址開啟。');
} catch { fatal('無法啟動背景運算，請使用新版 Safari 或 Chrome。'); }
setDefaultYears(); if (worker) schedule();

let offlineReady = false, refreshing = false;
function connectionStatus() {
  if (location.protocol === 'file:') { $('connection-state').textContent = '本機檔案版 · 可離線使用'; return; }
  $('connection-state').textContent = !navigator.onLine ? offlineReady ? '離線使用中' : '目前沒有網路' : offlineReady ? '已可離線使用' : '紫微反查 Web';
}
window.addEventListener('online', connectionStatus); window.addEventListener('offline', connectionStatus);
if (location.protocol === 'file:') {
  $('connection-state').textContent = '本機檔案版 · 可離線使用';
} else if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('controllerchange', () => { if (refreshing) location.reload(); });
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('./sw.js');
      const offerUpdate = () => { $('update-banner').hidden = false; };
      if (registration.waiting) offerUpdate();
      registration.addEventListener('updatefound', () => {
        const installing = registration.installing;
        installing.addEventListener('statechange', () => { if (installing.state === 'installed' && navigator.serviceWorker.controller) offerUpdate(); });
      });
      $('update-button').addEventListener('click', () => {
        if (!registration.waiting) return;
        refreshing = true; registration.waiting.postMessage('SKIP_WAITING');
      });
      await navigator.serviceWorker.ready; offlineReady = true; connectionStatus();
    } catch { $('connection-state').textContent = '離線儲存未完成，請保持連網'; }
  });
}
