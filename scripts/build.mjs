import { cp, mkdir, readdir, readFile, writeFile, rm } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const source = new URL('../public/', import.meta.url), output = new URL('../dist/', import.meta.url);
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
await cp(source, output, { recursive: true });
const hash = createHash('sha256');
for (const file of (await readdir(source)).sort()) { hash.update(file); hash.update(await readFile(new URL(file, source))); }
const version = hash.digest('hex').slice(0, 16);
const sw = (await readFile(new URL('sw.js', source), 'utf8')).replace("'ziwei-development-v1'", `'${version}'`);
await writeFile(new URL('sw.js', output), sw);
console.log(`靜態 PWA 已建立：${fileURLToPath(output)}（版本 ${version}）`);

// A self-contained preview also works when local HTTP sockets are unavailable.
// Deployment still uses dist/ and its ordinary external modules and service worker.
const modules = {};
for (const name of ['core', 'calendar', 'explanation', 'worker', 'app']) {
  modules[name] = (await readFile(new URL(`${name}.js`, source), 'utf8'))
    .replace(/^import .+ from .+;\n/gm, '').replace(/^export /gm, '');
}
const workerCode = `${modules.core}\n${modules.calendar}\n${modules.worker}`;
const appCode = modules.app.replace("new Worker(new URL('./worker.js', import.meta.url), { type: 'module' })",
  `new Worker(URL.createObjectURL(new Blob([${JSON.stringify(workerCode)}], { type: 'text/javascript' })))`);
const script = `${modules.core}\n${modules.calendar}\n${modules.explanation}\n${appCode}`;
const icon = `data:image/png;base64,${(await readFile(new URL('icon-192.png', source))).toString('base64')}`;
let html = await readFile(new URL('index.html', source), 'utf8');
html = html.replace('<link rel="stylesheet" href="./styles.css">', `<style>${await readFile(new URL('styles.css', source), 'utf8')}</style>`)
  .replace('<script type="module" src="./app.js"></script>', `<script type="module">${script.replaceAll('</script', '<\\/script')}</script>`)
  .replace('<link rel="manifest" href="./manifest.webmanifest">', '')
  .replace(/  <meta http-equiv="Content-Security-Policy"[^>]+>\n/, '')
  .replace('href="./" class="brand"', 'href="./preview.html" class="brand"')
  .replaceAll('./icon-192.png', icon);
const preview = new URL('../preview.html', import.meta.url);
await writeFile(preview, html);
console.log(`可雙擊試用：${fileURLToPath(preview)}`);
