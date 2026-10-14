// בונה index.html יחיד ועצמאי מתוך src/. הרצה: node build.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = dirname(fileURLToPath(import.meta.url));
const r = (p) => readFileSync(join(root, p), 'utf-8');
const js = ['math', 'config', 'core', 'tasks', 'screens'].map((n) => r(`src/js/${n}.js`)).join('\n');
if (/<\/script/i.test(js)) throw new Error('JS contains </script');
const html = r('src/index.html').replace('/*__CSS__*/', () => r('src/css/main.css')).replace('/*__JS__*/', () => js);
writeFileSync(join(root, 'index.html'), html, 'utf-8');
console.log('built index.html', (html.length / 1024).toFixed(1) + ' KB');
