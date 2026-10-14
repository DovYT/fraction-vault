/* DIGITAL – סוכני הכספת: ליבה – עזרי DOM, שמירה, שמע, גרירה, מנחה, רכיבי שבר ורצועה */
(function () {
  'use strict';
  const FV = window.FV;
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  FV.$ = $; FV.$$ = $$;
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  FV.pick = pick;
  FV.shuffle = (a) => { const r = a.slice(); for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; } return r; };
  FV.esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /* ---------- שמירה מקומית (בדפדפן בלבד) ---------- */
  const defaults = () => ({
    v: 1, mode: 'solo', names: [], done: 0, started: false,
    settings: { music: true, sfx: true, reduce: false, skipIntro: false, timer: false, demo: false, solutions: false },
  });
  function load() {
    try {
      const raw = localStorage.getItem(FV.STORAGE_KEY);
      if (raw) { const s = JSON.parse(raw); const d = defaults(); return Object.assign(d, s, { settings: Object.assign(d.settings, s.settings || {}) }); }
    } catch (e) { /* אחסון חסום – ממשיכים בלי שמירה */ }
    return defaults();
  }
  FV.state = load();
  FV.save = () => { try { localStorage.setItem(FV.STORAGE_KEY, JSON.stringify(FV.state)); } catch (e) { /* ignore */ } };
  FV.resetGame = () => { const s = FV.state.settings; FV.state = defaults(); FV.state.settings = s; FV.save(); };
  FV.reduced = () => FV.state.settings.reduce || (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  FV.wait = (ms) => new Promise((r) => setTimeout(r, FV.reduced() ? Math.min(ms, 200) : ms));

  /* ---------- שברים ---------- */
  FV.frac = (n, d, cls) => `<span class="frac ${cls || ''}" dir="ltr"><span class="n">${n}</span><span class="d">${d}</span></span>`;
  FV.mixed = (w, n, d) => (n === 0 ? `<span class="mixed" dir="ltr">${w}</span>` :
    (w === 0 ? FV.frac(n, d) : `<span class="mixed" dir="ltr">${w}${FV.frac(n, d)}</span>`));
  // [[5/3]] שבר, [[1 2/3]] מספר מעורב – מוחלף לתצוגה אנכית
  const EQTOK = '(?:\\[\\[[^\\]]+\\]\\]|\\d+)';
  const EQRE = new RegExp('(' + EQTOK + '(?: = ' + EQTOK + ')+)', 'g');
  // שרשרת שוויון (למשל [[5/3]] = [[1 2/3]]) נעטפת כיחידה אחת משמאל לימין
  FV.rich = (str) => FV.esc(str).split(/(\{\{.+?\}\})/).map((p, i) => (i % 2 ? p : p.replace(EQRE, '{{$1}}'))).join('').replace(/\[\[(?:(\d+) )?(\d+)\/(\d+)\]\]/g, (m, w, n, d) => {
    return w ? `<bdi dir="ltr">${FV.mixed(+w, +n, +d)}</bdi>` : `<bdi dir="ltr">${FV.frac(n, d)}</bdi>`;
  }).replace(/\{\{(.+?)\}\}/g, (m, x) => `<bdi dir="ltr" class="eq sm">${x}</bdi>`); // {{2 × 6 + 2 = 14}} – ביטוי חשבוני משמאל לימין
  // טקסט קריא לקוראי מסך
  FV.say = (w, n, d) => (w ? (n ? FV.words.mixedName(w, n, d) : String(w)) : FV.words.fractionName(n, d));
  FV.numInput = (id, label, extra) => `<input class="num" id="${id}" inputmode="numeric" pattern="[0-9]*" maxlength="2" autocomplete="off" aria-label="${label}" ${extra || ''}>`;

  /* רצועה: d תאים, count צבועים (לפי סדר), נתמך מצב "שלם" */
  FV.stripHTML = (d, on, opts) => {
    opts = opts || {};
    let cells = '';
    for (let i = 0; i < d; i++) {
      const isOn = i < on;
      cells += opts.buttons
        ? `<button type="button" class="cell${isOn ? ' on' : ''}" data-i="${i}" aria-pressed="${isOn}" aria-label="חלק ${i + 1} מתוך ${d} ברצועה ${opts.idx + 1}: ${isOn ? 'צבוע' : 'לא צבוע'}"></button>`
        : `<span class="cell${isOn ? ' on' : ''}"></span>`;
    }
    const whole = opts.whole;
    return `<div class="stripwrap${whole ? ' whole' : ''}" role="img" aria-label="${opts.label || ('רצועה מחולקת ל־' + d + ' חלקים שווים, ' + on + ' צבועים')}">
      <div class="arc"></div><div class="wbadge">${FV.frac(d, d)}<span>=</span>1</div>
      <div class="strip" ${opts.zone ? '' : ''}>${cells}</div></div>`;
  };
  /* ספירת כמות כוללת של q חלקים בגודל 1/d על פני s רצועות */
  FV.stripsFor = (d, q, s, opts) => {
    opts = opts || {}; let h = ''; const mark = opts.mark !== false;
    for (let i = 0; i < s; i++) {
      const on = Math.max(0, Math.min(d, q - i * d));
      h += FV.stripHTML(d, on, { whole: mark && opts.group && on === d, buttons: opts.buttons, idx: i, label: opts.label ? opts.label + ' – רצועה ' + (i + 1) : undefined });
    }
    return `<div class="strips">${h}</div>`;
  };

  /* ---------- מודאל אישור ---------- */
  FV.confirm = (title, msg, yes, no) => new Promise((res) => {
    const m = $('#modal'); const prev = document.activeElement;
    m.innerHTML = `<div class="box" role="alertdialog" aria-modal="true" aria-labelledby="mt"><h3 id="mt"></h3><p></p><div class="row"><button class="btn gold" id="my"></button><button class="btn ghost" id="mn"></button></div></div>`;
    $('h3', m).textContent = title; $('p', m).textContent = msg; $('#my', m).textContent = yes || 'כן'; $('#mn', m).textContent = no || 'ביטול';
    m.classList.add('on'); $('#mn', m).focus();
    const done = (v) => { m.classList.remove('on'); m.innerHTML = ''; if (prev && prev.focus) prev.focus(); res(v); };
    $('#my', m).onclick = () => done(true); $('#mn', m).onclick = () => done(false);
    m.onkeydown = (e) => { if (e.key === 'Escape') done(false); };
  });
  FV.toast = (t) => { const e = document.createElement('div'); e.className = 'toast'; e.textContent = t; document.body.appendChild(e); setTimeout(() => e.remove(), 2200); };

  /* ---------- שמע מסונתז (WebAudio, ללא קבצים) ---------- */
  const A = (FV.audio = { ctx: null, master: null, loopTimer: null, step: 0 });
  A.init = () => {
    if (A.ctx) { if (A.ctx.state === 'suspended') A.ctx.resume(); return; }
    try {
      const C = window.AudioContext || window.webkitAudioContext; if (!C) return;
      A.ctx = new C(); A.master = A.ctx.createGain(); A.master.gain.value = 0.55; A.master.connect(A.ctx.destination);
    } catch (e) { A.ctx = null; }
  };
  A.tone = (f, dur, type, vol, at) => {
    if (!A.ctx) return;
    const t = A.ctx.currentTime + (at || 0); const o = A.ctx.createOscillator(); const g = A.ctx.createGain();
    o.type = type || 'sine'; o.frequency.value = f;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol || 0.2, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(A.master); o.start(t); o.stop(t + dur + 0.05);
  };
  const N = { C4: 261.6, D4: 293.7, E4: 329.6, F4: 349.2, G4: 392, A4: 440, B4: 493.9, C5: 523.3, D5: 587.3, E5: 659.3, G5: 784, A5: 880, C6: 1046.5 };
  const sfx = (fn) => (...a) => { if (FV.state.settings.sfx) { A.init(); fn(...a); } };
  A.fanfare = sfx(() => { [N.C4, N.E4, N.G4, N.C5, N.G4, N.C5, N.E5, N.G5].forEach((f, i) => A.tone(f, 0.35, 'triangle', 0.16, i * 0.14)); A.tone(N.C5, 1.1, 'sawtooth', 0.06, 1.1); A.tone(N.G5, 1.1, 'triangle', 0.1, 1.1); });
  A.tick = sfx(() => A.tone(N.A4, 0.18, 'square', 0.07));
  A.click = sfx(() => A.tone(N.E5, 0.07, 'triangle', 0.08));
  A.drop = sfx(() => { A.tone(N.G4, 0.12, 'triangle', 0.12); A.tone(N.C5, 0.14, 'triangle', 0.1, 0.07); });
  A.tension = sfx(() => { for (let i = 0; i < 5; i++) A.tone(110 + i * 14, 0.28, 'sine', 0.2, i * 0.26); A.tone(N.A4, 0.2, 'triangle', 0.06, 1.1); });
  A.lock = sfx(() => { A.tone(150, 0.12, 'square', 0.12); A.tone(300, 0.1, 'square', 0.08, 0.1); });
  A.success = sfx(() => { [N.E5, N.G5, N.C6].forEach((f, i) => A.tone(f, 0.45, 'triangle', 0.16, i * 0.11)); A.tone(N.C5, 0.8, 'sine', 0.1, 0.3); });
  A.wrong = sfx(() => { A.tone(N.A4, 0.22, 'sine', 0.12); A.tone(N.F4, 0.34, 'sine', 0.12, 0.2); });
  A.digit = sfx(() => [N.G5, N.C6, N.G5, N.C6].forEach((f, i) => A.tone(f, 0.12, 'triangle', 0.12, i * 0.09)));
  A.victory = sfx(() => {
    const m = [N.C5, N.E5, N.G5, N.C6, N.G5, N.C6, N.E5 * 2];
    m.forEach((f, i) => { A.tone(f, 0.4, 'triangle', 0.18, i * 0.16); A.tone(f / 2, 0.4, 'sawtooth', 0.04, i * 0.16); });
    [N.C5, N.E5, N.G5, N.C6].forEach((f) => A.tone(f, 1.8, 'triangle', 0.1, 1.2));
  });
  // מוזיקת רקע עדינה בלולאה
  const LOOP = [N.C4, N.E4, N.G4, N.E4, N.A4 / 2 * 1, N.C4 * 1, N.F4, N.A4, N.G4, N.E4, N.D4, N.G4 / 2 * 1];
  A.musicOn = () => {
    A.stopMusic(); if (!FV.state.settings.music) return; A.init(); if (!A.ctx) return;
    A.loopTimer = setInterval(() => {
      if (!FV.state.settings.music || document.hidden) return;
      const f = LOOP[A.step++ % LOOP.length]; A.tone(f, 0.55, 'triangle', 0.035); if (A.step % 4 === 1) A.tone(f / 2, 1.2, 'sine', 0.04);
    }, 520);
  };
  A.stopMusic = () => { if (A.loopTimer) clearInterval(A.loopTimer); A.loopTimer = null; };
  A.say = (text) => { // קריינות אופציונלית – רק אם הדפדפן מספק קול בעברית
    try {
      if (!FV.state.settings.narrate || !('speechSynthesis' in window)) return;
      speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(text.replace(/<[^>]+>/g, '')); u.lang = 'he-IL'; u.rate = 0.95; speechSynthesis.speak(u);
    } catch (e) { /* ignore */ }
  };

  /* ---------- גרירה + חלופת מקלדת/הקשה (בחירה ואז יעד) ---------- */
  const D = (FV.drag = { sel: null });
  D.clear = () => { if (D.sel && D.sel.el) D.sel.el.classList.remove('sel'); D.sel = null; };
  D.attach = (piece, payload) => {
    let sx = null, sy = 0, ghost = null, moved = false, pid = null;
    const get = () => (typeof payload === 'function' ? payload() : payload);
    piece.addEventListener('pointerdown', (e) => {
      if (e.button > 0) return; sx = e.clientX; sy = e.clientY; moved = false; pid = e.pointerId; try { piece.setPointerCapture(pid); } catch (er) { /* ignore */ }
    });
    piece.addEventListener('pointermove', (e) => {
      if (sx === null || e.pointerId !== pid) return;
      if (!moved && Math.hypot(e.clientX - sx, e.clientY - sy) > 8) {
        moved = true; try { piece.setPointerCapture(pid); } catch (er) { /* ignore */ }
        ghost = piece.cloneNode(true); ghost.classList.add('dragghost'); ghost.removeAttribute('id'); document.body.appendChild(ghost); piece.classList.add('dragging');
      }
      if (moved) {
        ghost.style.left = e.clientX + 'px'; ghost.style.top = e.clientY + 'px';
        $$('.zone.hover').forEach((z) => z.classList.remove('hover'));
        const z = D.zoneAt(e.clientX, e.clientY); if (z) z.classList.add('hover');
      }
    });
    const end = (e) => {
      if (sx === null || e.pointerId !== pid) return;
      if (moved) {
        const z = D.zoneAt(e.clientX, e.clientY); if (ghost) ghost.remove();
        $$('.zone.hover').forEach((q) => q.classList.remove('hover')); piece.classList.remove('dragging');
        piece._skip = true; setTimeout(() => { piece._skip = false; }, 60);
        D.clear(); if (z && z._drop) z._drop(get());
      }
      sx = null; pid = null; ghost = null;
    };
    piece.addEventListener('pointerup', end);
    piece.addEventListener('pointercancel', (e) => { if (ghost) ghost.remove(); piece.classList.remove('dragging'); sx = null; });
    piece.addEventListener('click', () => {
      if (piece._skip) return; A.click();
      if (D.sel && D.sel.el === piece) { D.clear(); return; }
      D.clear(); piece.classList.add('sel'); D.sel = { el: piece, payload: get() };
      FV.announce('נבחר. עכשיו בחרו את המקום להנחה.');
    });
  };
  D.zoneAt = (x, y) => { const els = document.elementsFromPoint(x, y); for (const e of els) { const z = e.closest && e.closest('.zone'); if (z && z._drop) return z; } return null; };
  D.zone = (el, onDrop, label) => {
    el.classList.add('zone'); el.tabIndex = 0; el.setAttribute('role', 'button'); if (label) el.setAttribute('aria-label', label);
    el._drop = onDrop;
    const act = () => { if (D.sel) { const p = D.sel.payload; D.clear(); onDrop(p); } else FV.announce('קודם בחרו כרטיס או חלק להנחה.'); };
    el.addEventListener('click', (e) => { if (e.target.closest('.piece,.card,.pz')) return; act(); });
    el.addEventListener('keydown', (e) => { if ((e.key === 'Enter' || e.key === ' ') && e.target === el) { e.preventDefault(); act(); } });
  };
  FV.announce = (t) => { const a = $('#live'); if (a) { a.textContent = ''; setTimeout(() => { a.textContent = t; }, 30); } };

  /* ---------- מנחה ---------- */
  FV.hostSVG = () => `<svg class="host" viewBox="0 0 200 250" role="img" aria-label="נוגה, המנחה הווירטואלית">
    <defs><linearGradient id="hg1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe27a"/><stop offset="1" stop-color="#f0a912"/></linearGradient>
    <linearGradient id="hg2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7a3df0"/><stop offset="1" stop-color="#3a1b9c"/></linearGradient></defs>
    <line x1="100" y1="18" x2="100" y2="42" stroke="#9fb2ff" stroke-width="5"/><circle cx="100" cy="14" r="10" fill="#1fe0cf"/>
    <rect x="32" y="42" width="136" height="102" rx="44" fill="url(#hg1)" stroke="#fff" stroke-width="5"/>
    <rect x="48" y="66" width="104" height="42" rx="21" fill="#10196a" stroke="#1fe0cf" stroke-width="4"/>
    <circle cx="78" cy="87" r="10" fill="#fff"/><circle cx="122" cy="87" r="10" fill="#fff"/><circle cx="80" cy="88" r="5" fill="#10196a"/><circle cx="124" cy="88" r="5" fill="#10196a"/>
    <ellipse class="mouth" cx="100" cy="124" rx="16" ry="6" fill="#7a2b00"/>
    <rect x="62" y="146" width="76" height="14" rx="6" fill="#1fe0cf"/>
    <path d="M40 160 h120 l12 80 h-144z" fill="url(#hg2)" stroke="#fff" stroke-width="4"/>
    <path d="M100 160 l-18 14 l18 14 l18 -14z" fill="#ffcf3f" stroke="#fff" stroke-width="3"/>
    <text x="100" y="226" text-anchor="middle" font-size="22" font-weight="900" fill="#ffcf3f" font-family="sans-serif">DIGITAL</text>
    <circle cx="26" cy="100" r="14" fill="#1fe0cf" stroke="#fff" stroke-width="3"/><circle cx="174" cy="100" r="14" fill="#1fe0cf" stroke="#fff" stroke-width="3"/></svg>`;
  FV.hostSay = (html, raw) => {
    const b = $('#bubble'); if (!b) return; b.innerHTML = raw ? html : FV.rich(html);
    const h = $('.host'); if (h) { h.classList.remove('talk'); void h.getBoundingClientRect(); h.classList.add('talk'); }
    A.say(b.textContent);
  };

  /* ---------- אפקטים ---------- */
  FV.confetti = (n) => {
    if (FV.reduced()) return; const c = document.createElement('div'); c.className = 'confetti'; const cols = ['#ffcf3f', '#1fe0cf', '#3ddc84', '#8a4cf0', '#fff'];
    for (let i = 0; i < (n || 46); i++) { const e = document.createElement('i'); e.style.left = Math.random() * 100 + '%'; e.style.background = cols[i % cols.length]; e.style.animationDelay = Math.random() * 1.2 + 's'; e.style.transform = `rotate(${Math.random() * 360}deg)`; c.appendChild(e); }
    document.body.appendChild(c); setTimeout(() => c.remove(), 5200);
  };

  /* ---------- מסכים ופרמטרים גלובליים ---------- */
  FV.show = (id) => {
    $$('.screen').forEach((s) => s.classList.toggle('on', s.id === 's-' + id));
    document.body.dataset.screen = id; FV.screen = id; D.clear();
    $('#bar').hidden = ['splash', 'intro'].includes(id);
    window.scrollTo(0, 0);
  };
  FV.applySettings = () => {
    const s = FV.state.settings; document.body.classList.toggle('reduce', !!s.reduce); document.body.classList.toggle('demo', !!s.demo);
    const mb = $('#btnMusic'); if (mb) mb.setAttribute('aria-pressed', String(!!s.music));
    const sb = $('#btnSfx'); if (sb) sb.setAttribute('aria-pressed', String(!!s.sfx));
    FV.save();
  };
  FV.updateDigits = () => {
    $$('#bar .dslot').forEach((d, i) => {
      const got = i < FV.state.done; d.classList.toggle('got', got); d.textContent = got ? FV.DIGITS[i] : '?';
      d.setAttribute('aria-label', got ? `ספרה ${i + 1}: ${FV.DIGITS[i]}` : `ספרה ${i + 1}: עדיין לא נחשפה`);
    });
  };
  FV.fillSig = () => { $$('[data-sig]').forEach((e) => { e.textContent = FV.SIGNATURE; }); $$('[data-brand]').forEach((e) => { e.textContent = FV.BRAND; }); };
  FV.fullscreen = () => {
    try { if (!document.fullscreenElement) (document.documentElement.requestFullscreen || (() => FV.toast('מסך מלא אינו נתמך בדפדפן זה')))(); else document.exitFullscreen(); } catch (e) { FV.toast('מסך מלא אינו זמין'); }
  };
  FV.playerLabel = () => (FV.state.names.length ? FV.state.names.join(' ו') : '');
})();
