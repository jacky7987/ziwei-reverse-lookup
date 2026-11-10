import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

test('可部署版本及單檔預覽可建立，預覽的合併腳本語法有效且不載入外部模組', () => {
  execFileSync(process.execPath, [fileURLToPath(new URL('../scripts/build.mjs', import.meta.url))]);
  const preview = readFileSync(new URL('../preview.html', import.meta.url), 'utf8');
  const script = preview.match(/<script type="module">([\s\S]+?)<\/script>/)[1];
  assert.doesNotThrow(() => new vm.Script(script));
  assert.doesNotMatch(script, /^import .+ from /m);
  assert.doesNotMatch(script, /import\.meta/);
  assert.doesNotMatch(preview, /http-equiv="Content-Security-Policy"/);
  const deployed = readFileSync(new URL('../dist/index.html', import.meta.url), 'utf8');
  assert.match(deployed, /http-equiv="Content-Security-Policy"/);
  assert.doesNotMatch(readFileSync(new URL('../dist/sw.js', import.meta.url), 'utf8'), /const VERSION = 'ziwei-development-v1'/);
});
