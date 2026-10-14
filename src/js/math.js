/* DIGITAL – סוכני הכספת: ספריית מתמטיקה ושמות מספרים בעברית (טהורה, ללא DOM) */
(function (g) {
  'use strict';
  const FV = (g.FV = g.FV || {});

  const toImproper = (w, n, d) => w * d + n;
  const toMixed = (N, d) => ({ w: Math.floor(N / d), n: N % d, d });

  // מונים לשם זכר (שלישים) ולשם נקבה (שישיות)
  const NUM_M = [null, 'אחד', 'שני', 'שלושה', 'ארבעה', 'חמישה', 'שישה', 'שבעה', 'שמונה', 'תשעה', 'עשרה'];
  const NUM_F = [null, 'אחת', 'שתי', 'שלוש', 'ארבע', 'חמש', 'שש', 'שבע', 'שמונה', 'תשע', 'עשר'];
  // מספר שלם כפי שמופיע בספר הלימוד: "שתיים ושליש", "שלוש ושישית"
  const WHOLE = [ 'אפס', 'אחד', 'שתיים', 'שלוש', 'ארבע', 'חמש', 'שש', 'שבע', 'שמונה', 'תשע', 'עשר' ];
  const UNIT = { 3: { one: 'שליש', many: 'שלישים', fem: false }, 6: { one: 'שישית', many: 'שישיות', fem: true } };

  function partName(n, d) {
    const u = UNIT[d];
    if (!u) throw new Error('מכנה לא נתמך: ' + d);
    if (n === 1) return u.one;
    const word = (u.fem ? NUM_F : NUM_M)[n] || String(n); // מעל עשר – ספרות
    return word + ' ' + u.many;
  }
  function wholeName(w) { return WHOLE[w]; }
  function mixedName(w, n, d) {
    if (n === 0) return wholeName(w);
    if (w === 0) return partName(n, d);
    return wholeName(w) + ' ו' + partName(n, d);
  }
  // קריאה של שבר מדומה, לדוגמה 8/3 – "שמונה שלישים"
  const fractionName = partName;

  FV.math = { toImproper, toMixed };
  FV.words = { partName, wholeName, mixedName, fractionName };
})(typeof window !== 'undefined' ? window : globalThis);
