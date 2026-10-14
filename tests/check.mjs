// בדיקות אוטומטיות של התוכן והמתמטיקה. הרצה: node tests/check.mjs
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
await import(join(root, 'src/js/math.js')); await import(join(root, 'src/js/config.js'));
const FV = globalThis.FV; let pass = 0, fail = 0;
const t = (name, cond, extra) => { if (cond) { pass++; console.log('  ✓', name); } else { fail++; console.log('  ✗', name, extra ?? ''); } };
const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);

console.log('מתמטיקה והמרות');
t('5/3 = 1 2/3', eq(FV.math.toMixed(5, 3), { w: 1, n: 2, d: 3 }));
t('2 2/6 = 14/6', FV.math.toImproper(2, 2, 6) === 14 && FV.T2[0].ans === 14);
t('2 = 6/3', FV.math.toImproper(2, 0, 3) === 6 && FV.T2[1].ans === 6);
t('1 5/6 = 11/6', FV.math.toImproper(1, 5, 6) === 11 && FV.T2[2].ans === 11);
t('7/3 = 2 1/3', eq(FV.math.toMixed(7, 3), { w: 2, n: 1, d: 3 }) && FV.T2[3].aw === 2 && FV.T2[3].an === 1);
t('כל תרגילי משימה 2 עקביים', FV.T2.every((e) => e.kind === 'mixed' ? FV.math.toImproper(e.w, e.n, e.d) === e.ans : FV.math.toMixed(e.N, e.d).w === e.aw && FV.math.toMixed(e.N, e.d).n === e.an));

console.log('קוד הכספת');
t('הקוד הוא 16321', FV.CODE === '16321');
t('חמש ספרות, אחת לכל משימה', FV.DIGITS.length === 5 && FV.TASKS.length === 5);

console.log('שמות מספרים (כמו בספר הלימוד)');
const mn = FV.words.mixedName;
t('שתיים ושליש', mn(2, 1, 3) === 'שתיים ושליש', mn(2, 1, 3));
t('שתיים ושתי שישיות', mn(2, 2, 6) === 'שתיים ושתי שישיות', mn(2, 2, 6));
t('שלוש ושישית', mn(3, 1, 6) === 'שלוש ושישית', mn(3, 1, 6));
t('שתיים ושני שלישים', mn(2, 2, 3) === 'שתיים ושני שלישים', mn(2, 2, 3));
t('שני שלישים', mn(0, 2, 3) === 'שני שלישים');
t('שמונה שלישים', FV.words.fractionName(8, 3) === 'שמונה שלישים');
t('חמש שישיות', FV.words.fractionName(5, 6) === 'חמש שישיות');

console.log('משימה 3');
t('ארבע שורות עם שמות שונים', new Set(FV.T3.map((r) => mn(r.w, r.n, r.d))).size === 4);
t('שורה 4: 8/3 שווה 2 2/3', FV.T3[3].numCard.n === 8 && FV.T3[3].numCard.d === 3 && FV.math.toImproper(2, 2, 3) === 8);
t('כרטיסי מספר תואמים לרצועה', FV.T3.every((r) => { const c = r.numCard; const v = c.w !== undefined ? c.w * c.d + c.n : c.n; return v / c.d === (r.w * r.d + r.n) / r.d; }));

console.log('משימה 4');
const val = (it) => it.t === 'int' ? it.v : it.t === 'imp' ? it.n / it.d : it.w + it.n / it.d;
FV.T4.forEach((g, i) => {
  const others = g.items.filter((_, k) => k !== g.odd).map(val);
  t(`קבוצה ${i + 1}: שלושה שווים והיוצא דופן שונה`, others.every((v) => Math.abs(v - others[0]) < 1e-9) && Math.abs(val(g.items[g.odd]) - others[0]) > 1e-9);
  t(`קבוצה ${i + 1}: ארבעה ייצוגים ושלושה נימוקים`, g.items.length === 4 && g.reasons.length === 3);
});
const odds = FV.T4.map((g) => val(g.items[g.odd]));
t('יוצאי הדופן: 2/6, 7/6, 4/6', FV.T4[0].items[3].n === 2 && FV.T4[1].items[3].n === 7 && FV.T4[2].items[3].n === 4);

console.log('משימה 5 – מלאי והזמנות');
const need = FV.T5.orders.reduce((a, b) => a + b, 0), inv = FV.T5.inventory.w * 3 + FV.T5.inventory.t;
t('סך ההזמנות = סך המלאי (34 שלישים)', need === inv && inv === 34, `${need} vs ${inv}`);
t('אפשר לבנות את כל ההזמנות בלי עודף', FV.T5.orders.reduce((a, N) => a + Math.floor(N / 3), 0) * 3 + FV.T5.orders.reduce((a, N) => a + N % 3, 0) === inv);
t('ההזמנות הן 5,1,6,4,8,10 שלישים', eq(FV.T5.orders, [5, 1, 6, 4, 8, 10]));

console.log('מיתוג וחתימה');
t('חתימה מדויקת', FV.SIGNATURE === 'יפעת ויסמן קרמר | מובילה טכנו פדגוגיה');
t('שם המותג DIGITAL', FV.BRAND === 'DIGITAL');
const all = ['index.html', ...readdirSync(join(root, 'src/js')).map((f) => 'src/js/' + f), 'src/index.html', 'src/css/main.css'];
const sigHits = all.filter((f) => readFileSync(join(root, f), 'utf-8').includes('יפעת ויסמן'));
console.log('    מופיע ב:', sigHits.join(', '));
const stray = all.flatMap((f) => (readFileSync(join(root, f), 'utf-8').match(/יפעת ויסמן[^\n<"']{0,40}/g) || []).map((m) => [f, m]))
  .filter(([f, m]) => !m.startsWith('יפעת ויסמן קרמר | מובילה טכנו פדגוגיה') && !(f.endsWith('index.html') || true) );
const variants = new Set(all.flatMap((f) => readFileSync(join(root, f), 'utf-8').match(/יפעת ויסמן קרמר[^\n<"'`]{0,30}/g) || []));
t('כל ההופעות של החתימה זהות בדיוק', [...variants].every((v) => v.startsWith(FV.SIGNATURE)), [...variants].join(' // '));
const built = readFileSync(join(root, 'index.html'), 'utf-8');
t('index.html מכיל data-sig בכל המסכים הנדרשים', ['s-splash', 's-vault', 's-cert'].every((id) => new RegExp(`id="${id}"[\\s\\S]*?data-sig`).test(built)) && built.includes('id="sigbar"'));

console.log('פרטיות ועצמאות');
const code = ['src/js/core.js', 'src/js/tasks.js', 'src/js/screens.js'].map((f) => readFileSync(join(root, f), 'utf-8')).join('\n');
t('אין קריאות רשת בקוד', !/fetch\(|XMLHttpRequest|WebSocket|sendBeacon|navigator\.sendBeacon|importScripts/.test(code));
const urls = (built.match(/https?:\/\/[^\s"'<>)]+/g) || []).filter((u) => !u.startsWith('http://www.w3.org/2000/svg'));
t('אין כתובות חיצוניות ב־index.html', urls.length === 0, urls.join(','));
t('אין סקריפטים/סגנונות חיצוניים', !/<script[^>]+src=|<link[^>]+rel="stylesheet"/.test(built));
t('הקובץ הבנוי עצמאי ואינו מכיל תמונות סרוקות', !/\.(jpe?g|png|mp4)/i.test(built));

console.log(`\n${pass} עברו, ${fail} נכשלו`);
process.exit(fail ? 1 : 0);
