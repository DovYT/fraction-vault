/* DIGITAL – סוכני הכספת: מסכים, מנחה, מנגנון המשימות, כספת, תעודה והגדרות */
(function () {
  'use strict';
  const FV = window.FV; const { $, $$, rich, esc } = FV; const A = FV.audio; const H = FV.HOST;
  const st = () => FV.state; const studio = () => $('#studio');
  let introToken = 0; let prevScreen = 'splash'; let turn = 0;

  /* ---------- מסך פתיחה (לחיצה ראשונה מפעילה שמע) ---------- */
  function renderSplash() {
    const box = $('#splashBtns'); const s = st();
    const cont = s.names.length > 0 || s.done > 0 || s.won;
    box.innerHTML = cont
      ? '<button class="btn gold big" id="bContinue">▶ המשך משחק</button><button class="btn ghost" id="bNew">התחלת משחק חדש</button>'
      : '<button class="btn gold big" id="bStart">▶ התחלה</button>';
    if (cont) { $('#bContinue').onclick = continueGame; $('#bNew').onclick = newGame; } else $('#bStart').onclick = beginGame;
    ($('#bContinue') || $('#bStart')).focus();
  }
  async function newGame() {
    const ok = await FV.confirm('התחלת משחק חדש?', 'כל ההתקדמות והשמות שנשמרו יימחקו. האם להמשיך?', 'כן, התחילו מחדש', 'ביטול');
    if (!ok) return;
    FV.resetGame(); FV.updateDigits(); $('#taskRoot').innerHTML = ''; resetVault(); renderSplash(); FV.show('splash'); studio().classList.remove('dark', 'lit'); document.body.classList.remove('intro-lit');
  }
  function beginGame() { A.init(); A.musicOn(); st().started = true; FV.save(); if (st().settings.skipIntro) { litStudio(); goSetup(); } else playIntro(); }
  function continueGame() {
    A.init(); A.musicOn(); litStudio();
    const s = st();
    if (s.won) return showVault(true);
    if (s.done >= 5) return showVault(); startTask(s.done);
  }
  const litStudio = () => { studio().classList.add('lit'); document.body.classList.add('intro-lit'); };

  /* ---------- פתיח 8–12 שניות ---------- */
  async function playIntro() {
    const tok = ++introToken; const stg = $('#introStage'); FV.show('intro'); stg.innerHTML = '';
    const alive = () => tok === introToken;
    $('#skipIntro').focus();
    stg.innerHTML = `<div class="countdown" id="cdn" aria-live="assertive"></div>`;
    for (const n of [3, 2, 1]) { if (!alive()) return; const c = $('#cdn'); c.textContent = n; c.style.animation = 'none'; void c.offsetWidth; c.style.animation = ''; A.tick(); await FV.wait(1000); }
    if (!alive()) return;
    stg.innerHTML = ''; litStudio(); A.fanfare(); await FV.wait(1800); if (!alive()) return;
    stg.innerHTML = `<div class="logo reveal" id="r0"></div><h1 class="title reveal" id="r1">${FV.TITLE} ${FV.BRAND}</h1><h2 class="title reveal" style="font-size:2rem" id="r2"><small style="font-size:1em;margin:0">${FV.SUBTITLE}</small></h2>
      <p class="sigbig reveal" id="r3"></p><p class="reveal" id="r4"><button class="btn gold big" id="enter">🚪 היכנסו לאולפן</button></p>`;
    $('#r0').textContent = FV.BRAND; $('#r3').textContent = FV.SIGNATURE;
    for (const id of ['r1', 'r2', 'r3', 'r4']) { if (!alive()) return; $('#' + id).classList.add('in'); await FV.wait(id === 'r1' ? 1200 : 900); }
    $('#r0').classList.add('in'); $('#enter').onclick = () => { introToken++; goSetup(); }; $('#enter').focus();
  }
  function skipIntro() { introToken++; litStudio(); const s = st(); if (s.names.length || s.done) { continueGame(); } else goSetup(); }

  /* ---------- בחירת משחק ושמות ---------- */
  function goSetup() {
    FV.show('setup'); const pair = st().mode === 'pair'; setMode(pair ? 'pair' : 'solo'); $('#name1').value = st().names[0] || ''; $('#name2').value = st().names[1] || ''; $('#name1').focus();
  }
  function setMode(m) {
    st().mode = m; $('#modeSolo').setAttribute('aria-pressed', String(m === 'solo')); $('#modePair').setAttribute('aria-pressed', String(m === 'pair'));
    $('#name2wrap').hidden = m !== 'pair'; FV.save();
  }
  function ready() {
    const n1 = $('#name1').value.trim(); const n2 = $('#name2').value.trim();
    if (st().mode === 'pair' && (!n1 || !n2)) { FV.toast('במשחק זוגי יש להזין שני שמות'); (n1 ? $('#name2') : $('#name1')).focus(); return; }
    st().names = (st().mode === 'pair' ? [n1, n2] : [n1]).filter(Boolean); FV.save(); welcome();
  }
  async function welcome() {
    FV.show('welcome'); $('#welcomeTitle').textContent = H.welcome; const ag = $('#agents'); ag.innerHTML = ''; $('#btnGoTask').hidden = true;
    const names = st().names.length ? st().names : ['סוכן/ת סודי/ת'];
    names.forEach((n) => { const d = document.createElement('div'); d.className = 'agent'; d.textContent = n; ag.appendChild(d); });
    A.fanfare(); FV.announce(H.welcome + ' ' + names.join(' ו'));
    await FV.wait(names.length > 1 ? 2400 : 1700); $('#btnGoTask').hidden = false; $('#btnGoTask').focus();
  }

  /* ---------- מנגנון המשימות ---------- */
  function startTask(ti) {
    FV.show('task'); const T = FV.TASKS[ti]; const subs = FV.taskDefs[ti](); let si = 0; let busy = false; let hi = 0; turn = 0;
    const root = $('#taskRoot'); studio().classList.remove('dark');
    root.innerHTML = `<div class="gamegrid"><div class="taskcol">
      <div class="theader"><span class="tnum">משימה ${ti + 1} מתוך 5</span><h2></h2><span class="turn" id="turn" hidden></span></div>
      <p class="instr" id="instr"></p><div class="led" id="stage"></div><div class="fb" id="fb" role="status" aria-live="polite"></div>
      <div class="actions"><button class="btn ghost" id="btnHelp">🛟 גלגל ההצלה המתמטי</button><button class="btn gold" id="btnLock">זו התשובה שלנו!</button><button class="btn" id="btnNext" hidden></button></div></div>
      <aside class="hostcol"><div class="bubble" id="bubble" aria-live="polite"></div>${FV.hostSVG()}<div class="hostname">${H.name} – המנחה</div></aside></div>`;
    $('h2', root).textContent = T.title;
    const stage = $('#stage'), fb = $('#fb'), bL = $('#btnLock'), bN = $('#btnNext'), bH = $('#btnHelp');
    const showTurn = () => { const t = $('#turn'); if (st().mode === 'pair' && st().names.length === 2) { t.hidden = false; t.textContent = 'התור של: ' + st().names[turn % 2]; } else t.hidden = true; };
    const load = () => {
      const sub = subs[si]; busy = false; hi = 0; stage.classList.remove('ok', 'bad'); fb.className = 'fb'; fb.innerHTML = '';
      $('#instr').textContent = (subs.length > 1 ? `שלב ${si + 1} מתוך ${subs.length}: ` : '') + sub.instr; // הוראה גלויה בכל עת
      sub.render(stage); bL.hidden = false; bL.disabled = false; bN.hidden = true; showTurn();
      FV.hostSay(si === 0 ? T.pre : H.ready); FV.announce('הוראה: ' + sub.instr);
    };
    const showFb = (cls, html) => { fb.className = 'fb show ' + cls; fb.innerHTML = html; fb.scrollIntoView({ block: 'nearest', behavior: FV.reduced() ? 'auto' : 'smooth' }); };
    async function lock() {
      if (busy) return; busy = true; bL.disabled = true; fb.className = 'fb'; stage.classList.remove('ok', 'bad'); FV.drag.clear();
      const ov = document.createElement('div'); ov.className = 'lockov'; ov.innerHTML = '<div><div class="lk" aria-hidden="true">🔒</div>נועלים את התשובה…</div>'; stage.appendChild(ov);
      A.tension(); FV.hostSay(H.lockWait); await FV.wait(1300); ov.remove(); A.lock();
      const sub = subs[si]; const r = sub.check();
      if (r.ok) {
        A.success(); stage.classList.add('ok'); FV.confetti(16);
        let html = `<span class="ic">✓ נכון!</span><b>${rich(r.say)}</b>${r.explain ? '<div>' + rich(r.explain) + '</div>' : ''}${r.afterHTML || ''}`;
        FV.hostSay(r.say); bL.hidden = true; turn++;
        if (si < subs.length - 1) { showFb('ok', html); bN.textContent = 'לשלב הבא ➜'; bN.hidden = false; bN.onclick = () => { si++; load(); }; bN.focus(); }
        else {
          if (ti >= st().done) { st().done = ti + 1; FV.save(); }
          FV.updateDigits(); A.digit();
          html += `<div class="digitpop"><span>🔑 קיבלתם ספרה לקוד הכספת:</span><span class="big" aria-label="הספרה ${FV.DIGITS[ti]}">${FV.DIGITS[ti]}</span></div>`;
          showFb('ok', html); FV.hostSay(H.digit); FV.announce(`הספרה ${FV.DIGITS[ti]} נחשפה`);
          bN.textContent = ti < 4 ? 'למשימה הבאה ➜' : '🔐 לכספת!'; bN.hidden = false; bN.onclick = () => (ti < 4 ? startTask(ti + 1) : showVault()); bN.focus();
        }
      } else {
        A.wrong(); stage.classList.add('bad'); setTimeout(() => stage.classList.remove('bad'), 1400);
        showFb('bad', `<span class="ic">! נסו שוב</span><b>${rich(r.say)}</b>${r.hint ? '<div>💡 ' + rich(r.hint) + '</div>' : ''}<div>אפשר לנסות שוב.</div>`);
        FV.hostSay(r.say + (r.hint ? ' ' + r.hint : '')); if (r.after) r.after(); bL.disabled = false; busy = false;
      }
    }
    bL.onclick = lock;
    bH.onclick = () => {
      const hs = subs[si].hints; const h = hs[hi % hs.length]; hi++;
      const txt = typeof h === 'string' ? h : h.text; if (typeof h !== 'string' && h.run) h.run();
      FV.hostSay(txt); showFb('bad', `<span class="ic">🛟 רמז</span>${rich(txt)}`); fb.classList.remove('bad'); fb.classList.add('ok'); fb.style.borderColor = 'var(--teal)'; A.click();
    };
    stage.addEventListener('keydown', (e) => { if (e.key === 'Enter' && e.target.matches && e.target.matches('input.num')) { e.preventDefault(); bL.click(); } });
    load();
  }

  /* ---------- הכספת ---------- */
  function resetVault() { $('#vault').className = 'vault'; $('#fin').classList.remove('on'); $('#codeui').hidden = false; $('#rays').classList.remove('on'); $$('#vault .bolt').forEach((b) => b.classList.remove('key')); entered = ''; drawCode(); }
  let entered = '';
  function drawCode() {
    const cv = $('#codeview'); cv.innerHTML = ''; for (let i = 0; i < 5; i++) { const d = document.createElement('div'); d.className = 'dslot' + (entered[i] ? ' got' : ''); d.textContent = entered[i] || '•'; cv.appendChild(d); }
    cv.setAttribute('aria-label', 'הקוד שהוקלד: ' + (entered || 'עדיין ריק'));
  }
  function showVault(won) {
    FV.show('vault'); studio().classList.add('dark'); resetVault(); $('#vhost').innerHTML = FV.hostSVG().replace('class="host"', 'class="host" style="width:100%"');
    setTimeout(() => { const r = $('#vault').getBoundingClientRect(); const g = $('.spot.gold'); if (g) g.style.left = (r.left + r.width / 2 - innerWidth * 0.17) + 'px'; }, 80); $('#vbubble').textContent = H.vault; A.say(H.vault);
    if (won) { $('#vault').classList.add('open', 'spin'); $('#codeui').hidden = true; $('#fin').classList.add('on'); $('#rays').classList.add('on'); fillFinale(); return; }
    $('#keypad').querySelector('button').focus({ preventScroll: true });
  }
  function fillFinale() { $('#finTitle').textContent = FV.FINALE.title; $('#finText').textContent = FV.FINALE.text; }
  function press(k) {
    A.click(); const msg = $('#codemsg'); msg.textContent = '';
    if (k === 'del') entered = entered.slice(0, -1); else if (k === 'go') return tryOpen(); else if (entered.length < 5) entered += k;
    drawCode(); if (entered.length === 5 && k !== 'del') $('#keypadGo').focus();
  }
  async function tryOpen() {
    const msg = $('#codemsg');
    if (entered.length < 5) { msg.textContent = 'הקוד כולל חמש ספרות. השלימו את כל הספרות.'; return; }
    if (entered !== FV.CODE) { A.wrong(); msg.textContent = 'הקוד אינו נכון עדיין. הביטו בספרות שאספתם בראש המסך (לפי סדר המשימות) ונסו שוב.'; entered = ''; drawCode(); return; }
    // קוד נכון – אנימציית פתיחה
    $('#codeui').hidden = true; const v = $('#vault'); st().won = true; FV.save(); FV.announce('הקוד נכון! הכספת נפתחת');
    A.lock(); v.classList.add('spin'); await FV.wait(1100);
    $$('#vault .bolt').forEach((b) => b.classList.add('key')); await keyFlight(); A.lock(); await FV.wait(500);
    v.classList.add('open'); A.victory(); await FV.wait(1000); $('#rays').classList.add('on'); FV.confetti(70); setTimeout(() => FV.confetti(50), 1400);
    fillFinale(); $('#fin').classList.add('on'); $('#vbubble').textContent = 'יש! הכספת נפתחה!'; $('#toCert').focus();
  }
  async function keyFlight() {
    if (FV.reduced() || !Element.prototype.animate) return;
    const vr = $('#vault').getBoundingClientRect(); const tx = vr.left + vr.width / 2, ty = vr.top + vr.height / 2;
    const slots = $$('#bar .dslot'); const anims = slots.map((s, i) => {
      const r = s.getBoundingClientRect(); const k = document.createElement('div'); k.className = 'keyfly'; k.textContent = '🔑'; document.body.appendChild(k);
      const a = k.animate([{ left: r.left + 'px', top: r.top + 'px', opacity: 1, transform: 'scale(1)' }, { left: tx + 'px', top: ty + 'px', opacity: .1, transform: 'scale(.4) rotate(360deg)' }], { duration: 1000, delay: i * 120, easing: 'ease-in', fill: 'forwards' });
      a.onfinish = () => k.remove(); return a.finished;
    });
    try { await Promise.all(anims); } catch (e) { /* ignore */ }
  }

  /* ---------- תעודה ---------- */
  function showCert() {
    FV.show('cert'); studio().classList.remove('dark'); const nm = FV.state.certName != null ? FV.state.certName : FV.playerLabel();
    $('#certTitle').textContent = FV.CERT.title; $('#certPre').textContent = FV.CERT.pre; $('#certPost').textContent = FV.CERT.post; $('#certInput').value = nm; setCertName(nm);
  }
  function setCertName(v) { const e = $('#certName'); e.textContent = v.trim() || '________'; }

  /* ---------- הגדרות למורה ---------- */
  const SET_ITEMS = [
    ['music', 'מוזיקת רקע'], ['sfx', 'אפקטים קוליים'], ['reduce', 'ביטול אנימציות מורכבות'], ['skipIntro', 'דילוג על הפתיח'],
    ['timer', 'שעון מעודד (ללא פסילה)'], ['narrate', 'קריינות בעברית (אם קיימת בדפדפן)'], ['demo', 'מצב הדגמה כיתתית (כתב גדול ומעבר חופשי)'], ['solutions', 'הצגת פתרונות והסברים למורה'],
  ];
  function showSettings() {
    prevScreen = FV.screen === 'settings' ? prevScreen : FV.screen; FV.show('settings'); renderSettings();
  }
  function renderSettings() {
    const s = st().settings; const list = $('#setList'); list.innerHTML = '';
    SET_ITEMS.forEach(([k, label]) => {
      const row = document.createElement('div'); row.className = 'setrow';
      row.innerHTML = `<span class="t">${esc(label)}</span><button class="tog" role="switch" aria-checked="${!!s[k]}">${s[k] ? 'פעיל' : 'כבוי'}</button>`;
      row.querySelector('button').onclick = () => { s[k] = !s[k]; if (k === 'music') (s.music ? A.musicOn() : A.stopMusic()); if (k === 'timer') timerSync(); FV.applySettings(); renderSettings(); };
      list.appendChild(row);
    });
    const fs = document.createElement('div'); fs.className = 'setrow'; fs.innerHTML = '<span class="t">תצוגת מסך מלא</span><button class="tog" id="setFull" role="button">מעבר למסך מלא</button><button class="btn ghost" id="setReset" style="min-height:44px">איפוס המשחק</button>';
    list.appendChild(fs); $('#setFull').onclick = FV.fullscreen; $('#setReset').onclick = async () => { await newGame(); };
    $('#demoTools').hidden = !s.demo; const jump = $('#jump'); jump.innerHTML = '';
    if (s.demo) {
      FV.TASKS.forEach((t, i) => { const b = document.createElement('button'); b.className = 'btn ghost'; b.textContent = `${i + 1}. ${t.title}`; b.onclick = () => { st().started = true; startTask(i); }; jump.appendChild(b); });
      const bv = document.createElement('button'); bv.className = 'btn ghost'; bv.textContent = '🔐 כספת'; bv.onclick = () => showVault(); jump.appendChild(bv);
      const bc = document.createElement('button'); bc.className = 'btn ghost'; bc.textContent = '🎓 תעודה'; bc.onclick = showCert; jump.appendChild(bc);
    }
    const sol = $('#solutions'); sol.hidden = !s.solutions;
    sol.innerHTML = s.solutions ? '<h3>פתרונות והסברים (למורה בלבד)</h3><ol>' + FV.TASKS.map((t) => `<li><b>${esc(t.title)}:</b> ${rich(t.teacher)}</li>`).join('') + `</ol><p>קוד הכספת: <bdi dir="ltr"><b>${FV.CODE}</b></bdi></p>` : '';
  }
  let timerInt = null; let t0 = 0;
  function timerSync() {
    const el = $('#timer'); clearInterval(timerInt); if (!st().settings.timer) { el.hidden = true; return; }
    el.hidden = false; t0 = Date.now();
    const tick = () => { const sec = Math.floor((Date.now() - t0) / 1000); el.textContent = '⏱ ' + String(Math.floor(sec / 60)).padStart(2, '0') + ':' + String(sec % 60).padStart(2, '0'); if (sec > 0 && sec % 120 === 0 && FV.screen === 'task') FV.hostSay('קחו את הזמן – חשיבה טובה לוקחת זמן, ואין שום לחץ.'); };
    tick(); timerInt = setInterval(tick, 1000);
  }

  /* ---------- אתחול ---------- */
  function init() {
    FV.fillSig(); FV.applySettings(); FV.updateDigits(); timerSync();
    $('#bigvault').innerHTML = '<div class="vault"><div class="body"></div><div class="door"><i class="bolt"></i><i class="bolt"></i><i class="bolt"></i><i class="bolt"></i><i class="bolt"></i><div class="dial">D</div><i class="handle"></i></div></div>';
    const dg = $('#digits'); dg.innerHTML = ''; for (let i = 0; i < 5; i++) { const d = document.createElement('div'); d.className = 'dslot'; dg.appendChild(d); } FV.updateDigits();
    const kp = $('#keypad'); [1, 2, 3, 4, 5, 6, 7, 8, 9, 'del', 0, 'go'].forEach((k) => {
      const b = document.createElement('button'); b.className = 'btn' + (k === 'go' ? ' gold' : ''); b.type = 'button';
      b.textContent = k === 'del' ? '⌫' : (k === 'go' ? 'פתחו' : k); b.setAttribute('aria-label', k === 'del' ? 'מחיקת ספרה' : (k === 'go' ? 'פתחו את הכספת' : 'ספרה ' + k));
      if (k === 'go') { b.id = 'keypadGo'; b.style.fontSize = '1.1rem'; } b.onclick = () => press(String(k)); kp.appendChild(b);
    });
    document.addEventListener('keydown', (e) => {
      if (FV.screen !== 'vault' || $('#codeui').hidden) return; if (/^[0-9]$/.test(e.key)) press(e.key); else if (e.key === 'Backspace') press('del'); else if (e.key === 'Enter' && document.activeElement.tagName !== 'BUTTON') press('go');
    });
    $('#skipIntro').onclick = skipIntro; $('#modeSolo').onclick = () => setMode('solo'); $('#modePair').onclick = () => setMode('pair');
    $('#btnReady').onclick = ready; $('#btnGoTask').onclick = () => startTask(st().done >= 5 ? 4 : st().done);
    ['name1', 'name2'].forEach((i) => $('#' + i).addEventListener('keydown', (e) => { if (e.key === 'Enter') ready(); }));
    $('#toCert').onclick = showCert; $('#btnBackVault').onclick = () => showVault(true); $('#btnPrint').onclick = () => window.print();
    $('#certInput').addEventListener('input', (e) => { st().certName = e.target.value; FV.save(); setCertName(e.target.value); });
    $('#btnMusic').onclick = () => { const s = st().settings; s.music = !s.music; s.music ? A.musicOn() : A.stopMusic(); FV.applySettings(); };
    $('#btnSfx').onclick = () => { const s = st().settings; s.sfx = !s.sfx; FV.applySettings(); };
    $('#btnFull').onclick = FV.fullscreen; $('#btnSettings').onclick = showSettings; $('#splashSettings').onclick = showSettings; $('#btnNewBar').onclick = newGame;
    $('#setBack').onclick = () => { FV.show(prevScreen === 'settings' ? 'splash' : prevScreen); if (FV.screen === 'splash') renderSplash(); };
    renderSplash(); FV.show('splash');
    $('#bar').hidden = true;
  }
  document.addEventListener('DOMContentLoaded', init);
  FV.debug = { startTask, showVault, showCert, showSettings, press };
})();
