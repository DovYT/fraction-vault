/* DIGITAL – סוכני הכספת: חמש המשימות.
   כל משימה היא מערך של "שלבים": { instr, render(stage), check() -> {ok, say, explain, hint}, hints[] } */
(function () {
  'use strict';
  const FV = window.FV; const { $, $$, frac, mixed, rich, esc } = FV; const D = FV.drag; const W = FV.words;
  const num = (id) => { const v = parseInt(($('#' + id) || {}).value, 10); return Number.isNaN(v) ? NaN : v; };
  const mark = (id, st) => { const e = $('#' + id); if (e) { e.classList.remove('ok', 'bad'); if (st) e.classList.add(st); } };
  const unitMany = (d) => (d === 3 ? 'שלישים' : 'שישיות');
  const fracIn = (n, d) => `<span class="frac"><span class="n">${n}</span><span class="d">${d}</span></span>`;
  const wrongSay = () => FV.pick(FV.HOST.wrong);

  /* ====================== משימה 1 – מעבדת השלישים ====================== */
  function task1() {
    const S = { counts: [0, 0], pool: 5 };
    const strips = () => [0, 1].map((i) => {
      const full = S.counts[i] === 3; let cells = '';
      for (let k = 0; k < 3; k++) {
        cells += k < S.counts[i]
          ? `<button type="button" class="cell on placed" data-ret="${i}" aria-label="חלק שליש ברצועה ${i + 1}. הקישו להחזרה למגש"></button>`
          : '<span class="cell"></span>';
      }
      return `<div class="stripwrap${full ? ' whole' : ''}" data-strip="${i}"><div class="arc"></div><div class="wbadge">${frac(3, 3)}<span>=</span>1</div>
        <div class="strip">${cells}</div><div class="legend">רצועה ${i + 1}: ${S.counts[i]} מתוך 3</div></div>`;
    }).join('');
    const build = {
      instr: 'גררו חמישה שלישים אל הרצועות ובנו מהם שלם וכמות נוספת.',
      hints: FV.TASKS[0].hints,
      render(stage) {
        const draw = () => {
          let pcs = ''; for (let i = 0; i < S.pool; i++) pcs += `<button type="button" class="piece" aria-label="חלק בגודל שליש">${frac(1, 3)}</button>`;
          stage.innerHTML = `<div class="legend">מגש החלקים – נשארו ${S.pool} מתוך 5</div>
            <div class="tray" id="tray" aria-label="מגש חלקים">${pcs || '<span class="legend">כל החלקים הונחו</span>'}</div>
            <div class="strips" id="strs">${strips()}</div>`;
          $$('.piece', stage).forEach((p) => D.attach(p, { t: 'third' }));
          $$('[data-strip]', stage).forEach((z) => {
            const i = +z.dataset.strip;
            D.zone(z, () => place(i), `רצועה ${i + 1}, הניחו כאן חלק שליש`);
          });
          const tray = $('#tray', stage); D.zone(tray, () => FV.announce('החלקים כבר במגש. גררו אותם לרצועות.'), 'מגש החלקים');
          $$('[data-ret]', stage).forEach((b) => b.addEventListener('click', (e) => { e.stopPropagation(); S.counts[+b.dataset.ret]--; S.pool++; FV.audio.click(); draw(); }));
        };
        const place = (i) => {
          if (S.pool <= 0) return; if (S.counts[i] >= 3) { FV.announce('הרצועה מלאה'); return; }
          S.counts[i]++; S.pool--; FV.audio.drop(); draw();
          if (S.counts[i] === 3) { FV.audio.success(); FV.announce('שלושה שלישים יוצרים שלם אחד'); }
        };
        draw();
      },
      check() {
        if (S.pool > 0) return { ok: false, say: 'עוד לא הנחתם את כל חמשת החלקים.', hint: 'גררו את כל החלקים מהמגש אל הרצועות.' };
        const ok = (S.counts[0] === 3 && S.counts[1] === 2) || (S.counts[0] === 2 && S.counts[1] === 3);
        return ok ? { ok: true, say: 'שלושה שלישים יוצרים שלם אחד, ונשארים שני שלישים.', explain: 'שלושה שלישים יוצרים שלם אחד: [[3/3]] = 1. ונשארים שני שלישים.' }
          : { ok: false, say: 'מלאו קודם רצועה אחת לגמרי.', hint: 'שלושה שלישים ממלאים רצועה אחת.' };
      },
    };
    const fill = {
      instr: 'השלימו: איזה מספר מעורב שווה לחמישה שלישים?',
      hints: ['כמה רצועות מלאות יש? וכמה שלישים נשארו ברצועה האחרונה?', 'לכמה חלקים שווים חולק כל שלם?'],
      render(stage) {
        stage.innerHTML = `<div class="strips">${strips()}</div>
          <p class="center"><span class="eq">${frac(5, 3)}<span class="op">=</span>${FV.numInput('t1w', 'מספר השלמים')}${fracIn(FV.numInput('t1n', 'מונה'), FV.numInput('t1d', 'מכנה'))}</span></p>`;
        setTimeout(() => { const e = $('#t1w'); if (e) e.focus(); }, 50);
      },
      check() {
        const w = num('t1w'), n = num('t1n'), d = num('t1d'); mark('t1w'); mark('t1n'); mark('t1d');
        if (w === 1 && n === 2 && d === 3) { ['t1w', 't1n', 't1d'].forEach((i) => mark(i, 'ok')); return { ok: true, say: FV.pick(FV.HOST.right), explain: '[[5/3]] = [[1 2/3]]. שלם אחד ועוד שני שלישים.' }; }
        if (d !== 3) { mark('t1d', 'bad'); return { ok: false, say: wrongSay(), hint: 'לכמה חלקים שווים חולק כל שלם? הביטו בתאים של כל רצועה.' }; }
        if (w !== 1) { mark('t1w', 'bad'); return { ok: false, say: wrongSay(), hint: 'כמה רצועות מלאות (שלמים) יש בציור?' }; }
        mark('t1n', 'bad'); return { ok: false, say: wrongSay(), hint: 'כמה שלישים צבועים ברצועה שאינה מלאה?' };
      },
    };
    return [build, fill];
  }

  /* ====================== משימה 2 – מכונת ההמרות ====================== */
  function task2() {
    return FV.T2.map((e, idx) => {
      const d = e.d; const target = e.kind === 'mixed' ? e.w * d + e.n : e.N;
      const S = { counts: [0, 0, 0], grouped: false, open: false };
      const setTarget = () => { let q = target; S.counts = [0, 1, 2].map(() => { const c = Math.min(d, q); q -= c; return c; }); };
      return {
        instr: 'השלימו את השוויון. אפשר לפתוח המחשה ולצבוע חלקים.',
        hints: [
          `כמה ${unitMany(d)} יש בשלם אחד? זה המכנה.`,
          { text: 'פתחו את ההמחשה, צבעו את הכמות ולחצו "קבצו לשלמים".', run: () => { S.open = true; S.counts = [0, 0, 0]; S.grouped = false; S._draw && S._draw(); } },
          { text: 'בנו קודם את השלמים ורק אחר כך בדקו מה נשאר. הפעלתי לכם את ההמחשה.', run: () => { S.open = true; setTarget(); S.grouped = true; S._draw && S._draw(); } },
        ],
        render(stage) {
          const left = e.kind === 'mixed' ? (e.n === 0 ? `<span class="mixed">${e.w}</span>` : mixed(e.w, e.n, d)) : frac(e.N, d);
          const right = e.kind === 'mixed'
            ? fracIn(FV.numInput('t2a', 'מונה'), d)
            : `${FV.numInput('t2w', 'מספר השלמים')}${fracIn(FV.numInput('t2a', 'מונה'), d)}`;
          stage.innerHTML = `<p class="center"><span class="eq">${left}<span class="op">=</span>${right}</span></p>
            <p class="center"><button type="button" class="btn ghost" id="vz" aria-expanded="false">🔍 פתחו המחשה</button></p><div id="vzp"></div>`;
          const draw = () => {
            $('#vz').setAttribute('aria-expanded', String(S.open)); $('#vz').textContent = S.open ? '🔍 סגרו המחשה' : '🔍 פתחו המחשה';
            const p = $('#vzp'); if (!S.open) { p.innerHTML = ''; return; }
            const total = S.counts.reduce((a, b) => a + b, 0); const full = S.counts.filter((c) => c === d).length; const rest = total - full * d;
            let strips = '';
            S.counts.forEach((c, i) => { strips += FV.stripHTML(d, c, { buttons: true, idx: i, whole: S.grouped && c === d }); });
            p.innerHTML = `<div class="strips" id="vzs">${strips}</div>
              <p class="center legend">צבעו חלקים בלחיצה על התאים. כל חלק הוא ${frac(1, d)} מהשלם. צבעתם: ${total} חלקים.</p>
              <p class="center"><button type="button" class="btn ghost" id="grp">🧩 קבצו לשלמים</button> <button type="button" class="btn ghost" id="clr">🧹 נקו</button></p>
              <p class="center legend" id="sumln">${S.grouped ? `יש כאן ${full} שלמים${rest ? ' ועוד ' + W.partName(rest, d) : ''}.` : ''}</p>`;
            $$('#vzs .cell').forEach((b, k) => b.addEventListener('click', () => {
              const si = Math.floor(k / d), ci = k % d; S.counts[si] = ci < S.counts[si] ? ci : ci + 1; S.grouped = false; FV.audio.click(); draw();
            }));
            $('#grp').onclick = () => { S.grouped = true; FV.audio.drop(); draw(); };
            $('#clr').onclick = () => { S.counts = [0, 0, 0]; S.grouped = false; draw(); };
          };
          S._draw = draw; $('#vz').onclick = () => { S.open = !S.open; draw(); };
          setTimeout(() => { const f = $(e.kind === 'imp' ? '#t2w' : '#t2a'); if (f) f.focus(); }, 50);
        },
        check() {
          const a = num('t2a'); const w = num('t2w'); mark('t2a'); mark('t2w');
          const showTarget = () => { S.open = true; setTarget(); S.grouped = true; S._draw && S._draw(); };
          if (e.kind === 'mixed') {
            if (a === e.ans) {
              mark('t2a', 'ok'); showTarget();
              const lhs = e.n === 0 ? String(e.w) : `[[${e.w} ${e.n}/${d}]]`;
              return { ok: true, say: FV.pick(FV.HOST.right),
                explain: `מספר השלמים × המכנה${e.n ? ' + המונה' : ''}: {{${e.w} × ${d}${e.n ? ' + ' + e.n : ''} = ${e.ans}}}. לכן ${lhs} = [[${e.ans}/${d}]].`,
              };
            }
            mark('t2a', 'bad');
            return { ok: false, say: wrongSay(), hint: `כמה ${unitMany(d)} יש בשלם אחד? כמה שלמים יש כאן? בנו קודם את השלמים ואז הוסיפו את מה שנשאר.` };
          }
          if (w === e.aw && a === e.an) { mark('t2w', 'ok'); mark('t2a', 'ok'); showTarget();
            return { ok: true, say: FV.pick(FV.HOST.right), explain: `מקבצים שלמים: {{${e.aw} × ${d} = ${e.aw * d}}}, ונשאר {{${e.N} − ${e.aw * d} = ${e.an}}}. לכן [[${e.N}/${d}]] = [[${e.aw} ${e.an}/${d}]].` }; }
          mark('t2w', w === e.aw ? 'ok' : 'bad'); mark('t2a', a === e.an ? 'ok' : 'bad');
          return { ok: false, say: wrongSay(), hint: `כמה פעמים נכנסים ${d} ${unitMany(d)} ב־${e.N} ${unitMany(d)}? כמה נשאר?` };
        },
      };
    });
  }

  /* ====================== משימה 3 – חדר ההתאמות ====================== */
  function task3() {
    const rows = FV.T3.map((r, i) => ({ r, i, total: r.w * r.d + r.n, name: W.mixedName(r.w, r.n, r.d), numHTML: r.numCard.w ? mixed(r.numCard.w, r.numCard.n, r.numCard.d) : frac(r.numCard.n, r.numCard.d) }));
    const order = FV.shuffle(rows.map((x) => x.i));
    const order2 = FV.shuffle(rows.map((x) => x.i));
    const S = { slots: rows.map(() => ({ num: null, name: null, lock: false })), msgs: {} };
    return [{
      instr: 'התאימו לכל רצועה את המספר ואת שם המספר. גררו כרטיסים, או בחרו כרטיס ואז את המקום שלו.',
      hints: FV.TASKS[2].hints,
      render(stage) {
        const draw = () => {
          const used = (kind, id) => S.slots.some((s) => s[kind] === id);
          const card = (kind, id) => kind === 'num'
            ? `<button type="button" class="card num" data-k="num" data-id="${id}" aria-label="מספר: ${esc(FV.say(rows[id].r.numCard.w, rows[id].r.numCard.n, rows[id].r.numCard.d))}">${rows[id].numHTML}</button>`
            : `<button type="button" class="card name" data-k="name" data-id="${id}">${esc(rows[id].name)}</button>`;
          const poolN = order.filter((id) => !used('num', id)).map((id) => card('num', id)).join('');
          const poolM = order2.filter((id) => !used('name', id)).map((id) => card('name', id)).join('');
          let rh = '';
          rows.forEach((row) => {
            const s = S.slots[row.i]; const total = row.total; const st = s.lock ? ' ok' : (S.msgs[row.i] ? ' bad' : '');
            rh += `<div class="row3${st}" data-row="${row.i}">
              <div class="strips" role="img" aria-label="ציור: ${esc(W.mixedName(row.r.w, row.r.n, row.r.d))}">${FV.stripsFor(row.r.d, total, Math.ceil(total / row.r.d), { mark: false }).replace('class="strips"', 'class="strips" style="--sw:96px"')}</div>
              <div class="slot${s.num !== null ? ' full' : ''}" data-slot="num" data-row="${row.i}">${s.num !== null ? card('num', s.num) : '<span class="legend">מספר</span>'}</div>
              <div class="slot${s.name !== null ? ' full' : ''}" data-slot="name" data-row="${row.i}">${s.name !== null ? card('name', s.name) : '<span class="legend">שם המספר</span>'}</div>
              ${s.lock ? '<div class="legend"><span class="mark">✓ התאמה נכונה</span></div>' : ''}
              ${S.msgs[row.i] ? `<div class="ask"><span class="mark">!</span> ${esc(S.msgs[row.i])}</div>` : ''}</div>`;
          });
          stage.innerHTML = `<div class="legend">כרטיסי מספרים</div><div class="tray" id="pn">${poolN || '<span class="legend">כל המספרים הונחו</span>'}</div>
            <div class="legend">כרטיסי שמות</div><div class="tray" id="pm">${poolM || '<span class="legend">כל השמות הונחו</span>'}</div><div class="rows3">${rh}</div>`;
          $$('.card', stage).forEach((c) => { if (!c.closest('.row3.ok')) D.attach(c, { k: c.dataset.k, id: +c.dataset.id }); else c.disabled = true; });
          $$('.slot', stage).forEach((z) => {
            const ri = +z.dataset.row; if (S.slots[ri].lock) return;
            D.zone(z, (p) => put(ri, z.dataset.slot, p), `${z.dataset.slot === 'num' ? 'מקום למספר' : 'מקום לשם המספר'} ברצועה ${ri + 1}`);
          });
          ['pn', 'pm'].forEach((pid) => D.zone($('#' + pid, stage), (p) => back(p), 'החזרה למאגר הכרטיסים'));
        };
        const back = (p) => { S.slots.forEach((s) => { if (!s.lock && s[p.k] === p.id) s[p.k] = null; }); draw(); };
        const put = (ri, kind, p) => {
          if (p.k !== kind) { FV.announce(kind === 'num' ? 'כאן מניחים כרטיס מספר' : 'כאן מניחים כרטיס שם'); return; }
          S.slots.forEach((s) => { if (!s.lock && s[kind] === p.id) s[kind] = null; });
          S.slots[ri][kind] = p.id; S.msgs[ri] = null; FV.audio.drop(); draw();
        };
        S._draw = draw; draw();
      },
      check() {
        let allOk = true; let empty = false;
        rows.forEach((row) => {
          const s = S.slots[row.i]; if (s.lock) return;
          if (s.num === null || s.name === null) { empty = true; allOk = false; return; }
          const nOk = s.num === row.i, mOk = s.name === row.i;
          if (nOk && mOk) { s.lock = true; S.msgs[row.i] = null; return; }
          allOk = false;
          S.msgs[row.i] = !nOk ? row.r.askNum : row.r.askName;
          if (!nOk) s.num = null; if (!mOk) s.name = null;
        });
        S._draw();
        if (allOk) return { ok: true, say: FV.pick(FV.HOST.right), explain: 'כל ההתאמות נכונות! למשל: [[8/3]] = [[2 2/3]] – שתי רצועות שלמות ועוד שני שלישים.' };
        if (empty) return { ok: false, say: 'עוד לא מילאתם את כל המקומות.', hint: 'התאימו לכל רצועה גם מספר וגם שם. ההתאמות הנכונות נשארות במקומן.' };
        return { ok: false, say: wrongSay(), hint: 'קראו את השאלה המנחה שמופיעה ליד כל התאמה שאינה נכונה, והניחו שוב את הכרטיסים.' };
      },
    }];
  }

  /* ====================== משימה 4 – בלשי הייצוגים ====================== */
  function repHTML(it) {
    if (it.t === 'int') return `${it.v}`;
    if (it.t === 'imp') return frac(it.n, it.d);
    if (it.t === 'mixed') return mixed(it.w, it.n, it.d);
    return `<span class="strips miniwrap" style="--sw:70px;gap:4px" role="img">${FV.stripHTML(it.d, it.d, { whole: false })}${FV.stripHTML(it.d, it.n, {})}</span>`;
  }
  const repSay = (it) => (it.t === 'int' ? String(it.v) : it.t === 'imp' ? W.fractionName(it.n, it.d) : it.t === 'mixed' ? W.mixedName(it.w, it.n, it.d) : `ציור: ${W.mixedName(it.w, it.n, it.d)}`);
  const repVal = (it) => (it.t === 'int' ? { n: it.v, d: 1 } : it.t === 'imp' ? { n: it.n, d: it.d } : { n: it.w * it.d + it.n, d: it.d });
  FV.repVal = repVal;
  function task4() {
    return FV.T4.map((g, gi) => {
      const S = { sel: null, reason: null };
      const idxs = FV.shuffle([0, 1, 2, 3]);
      const rIdx = FV.shuffle([0, 1, 2]);
      const label = ['א', 'ב', 'ג'][gi];
      return {
        instr: `קבוצה ${label}׳: בחרו את הייצוג היוצא דופן ואז בחרו נימוק.`,
        hints: FV.TASKS[3].hints,
        render(stage) {
          const draw = () => {
            stage.innerHTML = `<div class="reps" role="group" aria-label="ארבעה ייצוגים">${idxs.map((i) => `<button type="button" class="rep" data-i="${i}" aria-pressed="${S.sel === i}" aria-label="${esc(repSay(g.items[i]))}${S.sel === i ? ' – נבחר' : ''}">${S.sel === i ? '<span class="tick">✓ נבחר</span>' : ''}${repHTML(g.items[i])}</button>`).join('')}</div>
              <h3>למה זה היוצא דופן?</h3><div class="reasons" role="group" aria-label="נימוקים">${rIdx.map((i) => `<button type="button" class="reason" data-r="${i}" aria-pressed="${S.reason === i}">${S.reason === i ? '✓ ' : '○ '}<span>${rich(g.reasons[i])}</span></button>`).join('')}</div><div id="proof"></div>`;
            $$('.rep', stage).forEach((b) => b.addEventListener('click', () => { S.sel = +b.dataset.i; FV.audio.click(); draw(); }));
            $$('.reason', stage).forEach((b) => b.addEventListener('click', () => { S.reason = +b.dataset.r; FV.audio.click(); draw(); }));
          };
          S._draw = draw; draw();
        },
        check() {
          if (S.sel === null) return { ok: false, say: 'בחרו קודם ייצוג יוצא דופן.', hint: 'השוו בין ארבעת הייצוגים.' };
          if (S.sel !== g.odd) return { ok: false, say: wrongSay(), hint: 'השוו את הציורים ולא רק את צורת הכתיבה: האם שלושה אחרים מייצגים אותה כמות?', after: () => { S.sel = null; S._draw(); } };
          if (S.reason === null) return { ok: false, say: 'הייצוג שבחרתם הוא היוצא דופן! עכשיו בחרו נימוק.', hint: 'בחרו מהרשימה את ההסבר שמתאים.' };
          if (S.reason !== 0) return { ok: false, say: 'הבחירה נכונה, אבל הנימוק עדיין לא מדויק.', hint: 'נסו נימוק שמתבסס על הכמות עצמה – על כמה שלמים וחלקים יש בכל ייצוג.', after: () => { S.reason = null; S._draw(); } };
          const proof = g.items.map((it, i) => {
            const v = repVal(it); const odd = i === g.odd; const d = v.d; const strips = Math.ceil(v.n / d);
            return `<div class="proofrow${odd ? ' oddrow' : ''}"><span class="lab">${repHTML(it)}</span>${FV.stripsFor(d, v.n, strips, { mark: false })}${odd ? '<span class="tag">✗ יוצא דופן</span>' : '<span class="tag" style="color:#3ddc84">= אותה כמות</span>'}</div>`;
          }).join('');
          return { ok: true, say: FV.pick(FV.HOST.right), explain: 'שלושה ייצוגים מסתיימים באותו מקום על הרצועות, והרביעי שונה.', afterHTML: `<div class="proof">${proof}</div>` };
        },
      };
    });
  }

  /* ====================== משימה 5 – מפעל הפיצות ====================== */
  const pizzaSVG = (kind) => {
    const tops = '<circle cx="36" cy="38" r="5" fill="#d9392b"/><circle cx="62" cy="44" r="5" fill="#d9392b"/><circle cx="50" cy="62" r="4" fill="#4f9a3b"/><circle cx="30" cy="62" r="3.5" fill="#4f9a3b"/><circle cx="70" cy="66" r="3.5" fill="#6b4b2a"/>';
    if (kind === 'w') return `<svg viewBox="0 0 100 100" role="img" aria-label="פיצה שלמה"><circle cx="50" cy="50" r="46" fill="#f2b84b" stroke="#b8741a" stroke-width="5"/><circle cx="50" cy="50" r="37" fill="#f7d27a"/>${tops}
      <path d="M50 50 L50 6 M50 50 L88 72 M50 50 L12 72" stroke="#b8741a" stroke-width="2.5"/></svg>`;
    return `<svg viewBox="0 0 100 90" role="img" aria-label="שליש פיצה"><path d="M50 78 L6 50 A52 52 0 0 1 94 50 Z" fill="#f7d27a" stroke="#b8741a" stroke-width="5" stroke-linejoin="round"/>
      <path d="M12 52 A48 48 0 0 1 88 52" stroke="#e0993a" stroke-width="7" fill="none"/><circle cx="40" cy="52" r="5" fill="#d9392b"/><circle cx="62" cy="48" r="4.5" fill="#d9392b"/><circle cx="50" cy="64" r="3.5" fill="#4f9a3b"/></svg>`;
  };
  function task5() {
    const T = FV.T5; const S = { pool: { w: T.inventory.w, t: T.inventory.t }, trays: T.orders.map(() => ({ w: 0, t: 0 })), msgs: {}, lock: T.orders.map(() => false) };
    const loc = (from) => (from === 'pool' ? S.pool : S.trays[from]);
    const build = {
      instr: 'גררו פיצות שלמות ושלישים אל מגשי ההזמנות. אפשר לפרק פיצה לשלישים ולחבר שלושה שלישים לפיצה.',
      hints: FV.TASKS[4].hints,
      render(stage) {
        const piece = (type, from) => `<button type="button" class="pz ${type === 't' ? 'third' : ''}" data-type="${type}" data-from="${from}" aria-label="${type === 'w' ? 'פיצה שלמה' : 'שליש פיצה'}">${pizzaSVG(type)}</button>`;
        const draw = () => {
          let tr = '';
          T.orders.forEach((N, i) => {
            const t = S.trays[i]; const w = Math.floor(N / 3), r = N % 3;
            tr += `<div class="tray3${S.lock[i] ? ' ok' : ''}" data-tray="${i}"><div class="ord"><span class="eq">${frac(N, 3)}<span class="op">=</span>${mixed(w, r, 3)}</span> <span>פיצה</span> ${S.lock[i] ? '<span class="mark">✓</span>' : ''}</div>
              <div class="pieces">${Array(t.w).fill(0).map(() => piece('w', i)).join('')}${Array(t.t).fill(0).map(() => piece('t', i)).join('')}</div>
              ${S.msgs[i] ? `<div class="ask"><span class="mark">!</span> ${esc(S.msgs[i])}</div>` : ''}</div>`;
          });
          stage.innerHTML = `<div class="pizzaboard"><div class="pool zone-wrap"><h3>המלאי במפעל</h3><div class="pieces" id="poolp">${Array(S.pool.w).fill(0).map(() => piece('w', 'pool')).join('')}${Array(S.pool.t).fill(0).map(() => piece('t', 'pool')).join('')}</div>
            <div class="count">${S.pool.w} פיצות שלמות, ${S.pool.t} שלישים</div>
            <div class="opbtns"><button type="button" class="ibtn" id="brk">✂ פרקו פיצה לשלישים</button><button type="button" class="ibtn" id="cmb">🔗 חברו 3 שלישים</button></div></div>
            <div class="trays">${tr}</div></div>`;
          $$('.pz', stage).forEach((b) => D.attach(b, { type: b.dataset.type, from: b.dataset.from === 'pool' ? 'pool' : +b.dataset.from }));
          D.zone($('.pool', stage), (p) => move(p, 'pool'), 'המלאי – החזרת חלק למלאי');
          $$('.tray3', stage).forEach((z) => { const i = +z.dataset.tray; if (!S.lock[i]) D.zone(z, (p) => move(p, i), `מגש הזמנה ${i + 1}`); });
          $('#brk').onclick = brk; $('#cmb').onclick = cmb;
        };
        const move = (p, to) => {
          if (p.from === to) return; const a = loc(p.from), b = loc(to); const k = p.type;
          if (a[k] <= 0) return; a[k]--; b[k]++; S.msgs[to] = null; FV.audio.drop(); draw();
        };
        const brk = () => {
          const s = D.sel && D.sel.payload; let f = s && s.type === 'w' ? s.from : (S.pool.w > 0 ? 'pool' : S.trays.findIndex((t, i) => t.w > 0 && !S.lock[i]));
          if (f === -1 || f === undefined || loc(f).w <= 0) { FV.announce('אין פיצה שלמה לפירוק'); return; }
          const l = loc(f); l.w--; l.t += 3; D.clear(); FV.audio.drop(); draw();
        };
        const cmb = () => {
          const s = D.sel && D.sel.payload; let f = s && s.type === 't' && loc(s.from).t >= 3 ? s.from : (S.pool.t >= 3 ? 'pool' : S.trays.findIndex((t, i) => t.t >= 3 && !S.lock[i]));
          if (f === -1 || f === undefined || loc(f).t < 3) { FV.announce('צריך לפחות שלושה שלישים באותו מקום'); FV.toast('צריך שלושה שלישים באותו מקום'); return; }
          const l = loc(f); l.t -= 3; l.w++; D.clear(); FV.audio.success(); draw();
        };
        S._draw = draw; draw();
      },
      check() {
        let ok = true;
        T.orders.forEach((N, i) => {
          if (S.lock[i]) return; const t = S.trays[i]; const total = t.w * 3 + t.t; const w = Math.floor(N / 3), r = N % 3;
          if (t.w === w && t.t === r) { S.lock[i] = true; S.msgs[i] = null; return; }
          ok = false;
          S.msgs[i] = total !== N ? 'בדקו: כמה שלישים יש בהזמנה כולה, ומה ההזמנה מבקשת?' : 'אפשר לחבר שלושה שלישים לפיצה שלמה.';
        });
        S._draw();
        if (ok && S.pool.w === 0 && S.pool.t === 0) return { ok: true, say: FV.pick(FV.HOST.right), explain: 'כל ההזמנות הורכבו, בלי חוסר ובלי עודף! בסך הכול 34 שלישים: [[34/3]] פיצות.' };
        if (ok) return { ok: false, say: 'כל ההזמנות נכונות, אבל נשארו חלקים במלאי.', hint: 'בדקו שהשתמשתם בכל החלקים.' };
        return { ok: false, say: wrongSay(), hint: 'קראו את ההערה ליד כל הזמנה שאינה נכונה והתאימו את המגש.' };
      },
    };
    const why = { sel: null };
    const reasons = FV.shuffle([0, 1, 2]);
    return [build, {
      instr: 'כיצד ידעתם כמה פיצות שלמות וכמה שלישים דרושים לכל הזמנה?',
      hints: ['חשבו על ההזמנה [[5/3]] – כמה פעמים נכנסים שלושה שלישים בחמישה שלישים?'],
      render(stage) {
        const draw = () => {
          stage.innerHTML = `<div class="reasons" role="group">${reasons.map((i) => `<button type="button" class="reason" data-r="${i}" aria-pressed="${why.sel === i}">${why.sel === i ? '✓ ' : '○ '}<span>${rich(T.reasons[i])}</span></button>`).join('')}</div>`;
          $$('.reason', stage).forEach((b) => b.addEventListener('click', () => { why.sel = +b.dataset.r; FV.audio.click(); draw(); }));
        }; draw();
      },
      check() {
        if (why.sel === null) return { ok: false, say: 'בחרו הסבר.', hint: 'בחרו מבין האפשרויות.' };
        if (why.sel === 0) return { ok: true, say: FV.pick(FV.HOST.right), explain: 'בדיוק: מחלקים ב־3. למשל [[10/3]]: 3 פיצות שלמות ושארית של שליש אחד, כלומר [[10/3]] = [[3 1/3]].' };
        return { ok: false, say: wrongSay(), hint: 'נסו את [[5/3]]: שלושה שלישים הם פיצה אחת. כמה פיצות שלמות יש, וכמה שלישים נשארו?' };
      },
    }];
  }

  FV.taskDefs = [task1, task2, task3, task4, task5];
  FV.pizzaSVG = pizzaSVG;
})();
