// ============================================
// ARIA — interactive maintenance copilot demo
// All equipment, tags and data below are fictional / illustrative.
// ============================================
(function () {
  const root = document.getElementById('aria-console');
  if (!root) return;

  const $ = (sel, el = root) => el.querySelector(sel);
  const $$ = (sel, el = root) => Array.from(el.querySelectorAll(sel));
  const chat = $('#ac-chat');
  const suggestBox = $('#ac-suggest');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const sleep = ms => new Promise(r => setTimeout(r, reduceMotion ? 0 : ms));

  // ---------- knowledge base (fictional) ----------
  const drawingSvg = `<svg viewBox="0 0 120 70" aria-hidden="true">
      <g fill="none" stroke="#2de8c4" stroke-width="1.2">
        <rect x="8" y="10" width="26" height="18" rx="2"/><rect x="86" y="10" width="26" height="18" rx="2"/>
        <rect x="47" y="42" width="26" height="18" rx="2" stroke="#ffd400"/>
        <path d="M34 19h52M21 28v23h26M99 28v23H73"/>
      </g>
      <g fill="#5b6472" font-family="monospace" font-size="6"><text x="11" y="21">PLC</text><text x="89" y="21">I/O</text><text x="50" y="53" fill="#ffd400">K12</text></g>
    </svg>`;

  const S = {
    'dryer-tag': {
      mod: 'tags', q: "What's the tag for Dryer Zone 3 temperature?", kw: ['dryer', 'zone', 'temp', 'rtd'],
      text: 'Zone 3 RTD is on <b>Cabinet 7080 — Dryer &amp; Calender</b>. Live values from the demo snapshot:',
      card: { type: 'kv', title: 'CAB 7080 · DRYER ZONE 3', rows: [
        ['Temperature PV', '<code>DB120.DBW30</code>', '182.4 °C'],
        ['PID setpoint', '<code>DB120.DBD40</code>', '185.0 °C'],
        ['Heater output', '<code>DB120.DBW34</code>', '71 %'],
        ['High-temp alarm', '<code>DB120.DBX2.3</code>', 'OFF']
      ] },
      actions: [{ label: 'Show PID trend notes', go: 'pid-notes' }, { label: 'Open wiring drawing', go: 'dryer-drawing' }]
    },
    'pid-notes': {
      mod: 'tags', q: 'Show PID trend notes for Zone 3',
      text: 'PV is tracking <b>2.6 °C below setpoint</b> with output at 71 %. That pattern usually means a weak heater bank rather than a tuning issue. Last tuning change: 3 weeks ago (Kp 2.1 → 1.8).',
      actions: [{ label: 'Flag heater bank check', flag: 'Inspect Dryer Zone 3 heater bank — PV lagging SP at 71 % output', type: 'Electrical' }]
    },
    'dryer-drawing': {
      mod: 'drawings', q: 'Open the wiring drawing for Dryer Zone 3',
      text: 'Here is the sheet that covers the Zone 3 RTD and heater contactor:',
      card: { type: 'drawing', title: 'EL-7080-014 · Rev C', desc: 'RTD input card slot 4, ch 2 → contactor K12 (heater bank 3).' },
      actions: [{ label: 'Next sheet →', toast: 'Demo: would open EL-7080-015' }]
    },
    'no-fault': {
      mod: 'troubleshoot', q: 'Packaging line stopped, no fault code on the HMI.', kw: ['stop', 'packag', 'fault', 'no code', 'stopped'],
      text: "Let's walk it in order. Check each item as you confirm it:",
      card: { type: 'steps', title: 'PACKAGING · SILENT STOP', steps: [
        'E-stop chain clear (all 6 mushrooms released)?',
        'Air pressure ≥ 5.5 bar on the packaging skid?',
        'Infeed photo eye PE-21 not blocked / dirty?',
        'Check <code>DB560.DBX0.0</code> — latched interlock the HMI does not surface'
      ] },
      actions: [{ label: 'Interlock is latched', go: 'interlock' }, { label: 'Open interlock drawing', go: 'interlock-drawing' }]
    },
    'interlock': {
      mod: 'troubleshoot', q: 'The interlock DB560.DBX0.0 is latched.',
      text: 'That bit latches when the <b>wrapper door switch</b> opened while running. Close the door, confirm <code>I 12.4</code> = 1, then press <b>Reset</b> on the packaging HMI. If it re-latches immediately, the switch actuator is likely misaligned.',
      actions: [{ label: 'Log intervention', flag: 'Packaging silent stop — wrapper door interlock latched, reset', type: 'Safety' }, { label: 'Safety reset sequence', go: 'card-guard' }]
    },
    'interlock-drawing': {
      mod: 'drawings', q: 'Open the interlock drawing for packaging',
      text: 'Wrapper door interlock circuit:',
      card: { type: 'drawing', title: 'EL-5600-003 · Rev B', desc: 'Door switch S-34 (dual channel) → safety input I 12.4 / I 12.5.' },
      actions: [{ label: 'Download PDF', toast: 'Demo: would download EL-5600-003.pdf' }]
    },
    'card-guard': {
      mod: 'safety', q: 'Show me the safety relay for the card guard.', kw: ['safety', 'relay', 'guard', 'card', 'reset'],
      text: 'PSR relay, <b>Cabinet 30, channel 2</b>. Documented in <code>FOR_CARD_Safety_Rev3</code>.',
      card: { type: 'safety', title: '⚠ SAFETY FUNCTION · CARD GUARD', rows: [
        ['Stop category', 'Cat. 3 / PL d'], ['Monitoring', 'Dual channel, cross-monitored'],
        ['Reset', 'Manual, monitored (falling edge)'], ['Proof test', 'Every 6 months']
      ] },
      actions: [{ label: 'Show reset sequence', go: 'reset-seq', amber: true }]
    },
    'reset-seq': {
      mod: 'safety', q: 'Show the reset sequence',
      text: 'Follow this sequence — never bypass the guard to reset:',
      card: { type: 'steps', title: 'CARD GUARD · RESET', steps: [
        'Confirm nobody is inside the guarded area',
        'Close and lock the guard — both channel LEDs green on PSR',
        'Press and release the blue Reset button (reset on release)',
        'Verify “Safety OK” on the HMI before restarting'
      ] }
    },
    'drawings-list': {
      mod: 'drawings', q: 'Which drawings cover Cabinet 7080?', kw: ['drawing', 'wiring', 'diagram', 'cabinet', 'sheet'],
      text: 'Cabinet 7080 has 3 key sheets in the demo index:',
      card: { type: 'kv', title: 'CAB 7080 · DRAWING INDEX', rows: [
        ['Power distribution', '<code>EL-7080-002</code>', 'Rev D'],
        ['Dryer RTD & heaters', '<code>EL-7080-014</code>', 'Rev C'],
        ['Calender drives', '<code>EL-7080-021</code>', 'Rev A']
      ] },
      actions: [{ label: 'Open EL-7080-014', go: 'dryer-drawing' }]
    },
    'photo-eye': {
      mod: 'log', q: 'Log this to shift notes: replaced photo eye on Buff 2.', kw: ['log', 'note', 'replaced', 'photo', 'eye', 'buff'],
      text: 'Logged — <b>14:32</b>, Buff 2 photo eye replacement. ⚠ This is the <b>third one this month</b> on Buff 2.',
      log: { time: '14:32', asset: 'Buff 2', event: 'Photo eye replaced', type: 'Electrical', dt: 18 },
      actions: [{ label: 'Flag for reliability review', flag: 'Buff 2 photo eye — 3rd failure this month, root cause review', type: 'Electrical', amber: true }, { label: 'View failure patterns', report: 'patterns' }]
    },
    'shift-summary': {
      mod: 'log', q: 'Give me the shift summary so far.', kw: ['summary', 'shift', 'report', 'today'],
      text: 'Shift B so far: <b>{{count}} interventions</b>, <b>{{dt}} min</b> downtime. The top repeat offender is Buff 2.',
      actions: [{ label: 'Open shift report', report: 'shift' }]
    }
  };

  const MODS = {
    troubleshoot: ['no-fault'],
    tags: ['dryer-tag'],
    safety: ['card-guard'],
    drawings: ['drawings-list', 'interlock-drawing'],
    log: ['photo-eye', 'shift-summary']
  };
  const AUTOPLAY = ['dryer-tag', 'no-fault', 'card-guard', 'photo-eye'];

  // ---------- report data (fictional) ----------
  const logRows = [
    { time: '06:48', asset: 'Carding 1', event: 'Doffer comb belt re-tensioned', type: 'Mechanical', dt: 22 },
    { time: '08:15', asset: 'Buff 2', event: 'Photo eye realigned', type: 'Electrical', dt: 9 },
    { time: '09:40', asset: 'Card guard', event: 'Guard reset after jam clearing', type: 'Safety', dt: 6 },
    { time: '11:05', asset: 'Dryer Z3', event: 'Heater contactor K12 checked', type: 'Electrical', dt: 14 },
    { time: '12:20', asset: 'Winder', event: 'Core chuck bearing greased', type: 'Mechanical', dt: 11 }
  ];
  const patterns = [
    { asset: 'Buff 2', n: 9, note: '6 of 9 are photo-eye related — likely vibration on the mounting bracket.' },
    { asset: 'Packaging', n: 7, note: 'Mostly silent stops from wrapper door interlock.' },
    { asset: 'Dryer Z3', n: 5, note: 'Heater bank output creeping up — possible element degradation.' },
    { asset: 'Carding 1', n: 4, note: 'Belt tension drift after each grade change.' },
    { asset: 'Winder', n: 2, note: 'Routine lubrication findings.' }
  ];
  let actions = [
    { text: 'Replace worn guide roller bearing — Winder', type: 'Mechanical', done: false, src: 'Planned · WO-4471' }
  ];

  // ---------- chat rendering ----------
  let busy = false;
  let userTookOver = false;

  function el(tag, cls, html) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }
  function scrollDown() { chat.scrollTop = chat.scrollHeight; }
  function now() { const d = new Date(); return d.toTimeString().slice(0, 5); }

  function addMsg(who, contentNode) {
    const empty = $('.ac-empty', chat);
    if (empty) empty.remove();
    const msg = el('div', 'ac-msg ac-msg-' + who);
    msg.appendChild(el('div', 'ac-avatar', who === 'aria' ? 'AI' : 'TE'));
    const bubble = el('div', 'ac-bubble');
    bubble.appendChild(el('span', 'ac-meta', (who === 'aria' ? 'ARIA' : 'Technician') + ' · ' + now()));
    bubble.appendChild(contentNode);
    msg.appendChild(bubble);
    chat.appendChild(msg);
    scrollDown();
    return bubble;
  }

  async function typeInto(node, text) {
    if (reduceMotion) { node.textContent = text; return; }
    for (let i = 0; i < text.length; i++) {
      node.textContent += text.charAt(i);
      if (i % 3 === 0) scrollDown();
      await sleep(16);
    }
  }

  function renderCard(card) {
    if (card.type === 'kv' || card.type === 'safety') {
      const c = el('div', 'ac-card' + (card.type === 'safety' ? ' ac-safety' : ''));
      c.appendChild(el('div', 'ac-card-head', `<span>${card.title}</span><span>${card.type === 'kv' ? 'LIVE · DEMO' : 'DOC'}</span>`));
      const t = el('table', 'ac-kv');
      card.rows.forEach(r => {
        const tr = el('tr');
        r.forEach((v, i) => tr.appendChild(el('td', i === 2 ? 'ac-live' : '', v)));
        t.appendChild(tr);
      });
      c.appendChild(t);
      return c;
    }
    if (card.type === 'steps') {
      const c = el('div', 'ac-card');
      const head = el('div', 'ac-card-head', `<span>${card.title}</span><span class="ac-count">0/${card.steps.length}</span>`);
      const prog = el('div', 'ac-progress', '<i></i>');
      const ul = el('ul', 'ac-steps');
      card.steps.forEach(s => {
        const li = el('li');
        li.innerHTML = `<label><input type="checkbox"><span>${s}</span></label>`;
        ul.appendChild(li);
      });
      ul.addEventListener('change', () => {
        const boxes = $$('input', ul);
        const done = boxes.filter(b => b.checked).length;
        $('.ac-count', head).textContent = `${done}/${boxes.length}`;
        $('i', prog).style.width = (done / boxes.length * 100) + '%';
        if (done === boxes.length) toast('✓ Checklist complete');
      });
      c.append(head, prog, ul);
      return c;
    }
    if (card.type === 'drawing') {
      const c = el('div', 'ac-card');
      c.appendChild(el('div', 'ac-card-head', '<span>ELECTRICAL DRAWING</span><span>PDF</span>'));
      c.appendChild(el('div', 'ac-drawing', `${drawingSvg}<div><strong>${card.title}</strong>${card.desc}</div>`));
      return c;
    }
    return el('div');
  }

  function renderActions(list) {
    const wrap = el('div', 'ac-buttons');
    list.forEach(a => {
      const b = el('button', 'ac-action' + (a.amber ? ' amber' : ''));
      b.type = 'button';
      b.textContent = a.label;
      b.addEventListener('click', () => {
        stopAutoplay(true);
        if (a.go) ask(a.go);
        if (a.flag) {
          addAction(a.flag, a.type, 'Flagged from chat · ' + now());
          b.disabled = true;
          b.textContent = '✓ Flagged';
        }
        if (a.toast) toast(a.toast);
        if (a.report) openReports(a.report);
      });
      wrap.appendChild(b);
    });
    return wrap;
  }

  function fillTemplate(text) {
    const dt = logRows.reduce((s, r) => s + r.dt, 0);
    return text.replace('{{count}}', logRows.length).replace('{{dt}}', dt);
  }

  async function ask(id, customQuestion) {
    const sc = S[id];
    if (!sc || busy) return;
    busy = true;
    setModule(sc.mod, false);

    const qNode = el('span');
    addMsg('user', qNode);
    await typeInto(qNode, customQuestion || sc.q);
    await sleep(250);

    const typing = el('div', 'ac-typing', '<span></span><span></span><span></span>');
    const bubble = addMsg('aria', typing);
    await sleep(700);
    typing.remove();

    if (sc.log && !logRows.some(r => r.event === sc.log.event && r.time === sc.log.time)) {
      logRows.push(sc.log);
      renderReports();
    }
    const body = el('div', '', fillTemplate(sc.text));
    bubble.appendChild(body);
    if (sc.card) bubble.appendChild(renderCard(sc.card));
    if (sc.actions) bubble.appendChild(renderActions(sc.actions));
    scrollDown();
    busy = false;
  }

  function fallback(question) {
    const qNode = el('span');
    qNode.textContent = question;
    addMsg('user', qNode);
    const b = addMsg('aria', el('div', '', "In this demo I only know a few fictional scenarios. Try one of these:"));
    b.appendChild(renderActions([
      { label: 'Dryer Zone 3 tag', go: 'dryer-tag' },
      { label: 'Silent stop', go: 'no-fault' },
      { label: 'Card guard relay', go: 'card-guard' }
    ]));
  }

  // ---------- modules + suggestions ----------
  function setModule(mod, clearChat) {
    $$('.ac-mod').forEach(b => b.classList.toggle('active', b.dataset.mod === mod));
    suggestBox.innerHTML = '';
    (MODS[mod] || []).forEach(id => {
      const b = el('button', 'ac-sugg');
      b.type = 'button';
      b.textContent = S[id].q;
      b.addEventListener('click', () => { stopAutoplay(true); ask(id); });
      suggestBox.appendChild(b);
    });
    if (clearChat) showEmpty(mod);
  }

  const EMPTY = {
    troubleshoot: ['Guided troubleshooting', 'Describe the symptom — ARIA walks you through a checklist.'],
    tags: ['PLC tag reference', 'Look up any tag by equipment name, cabinet or address.'],
    safety: ['Safety & interlocks', 'Category, reset sequence and documentation on demand.'],
    drawings: ['Electrical drawings', 'Jump straight to the right sheet and revision.'],
    log: ['Shift log', 'Dictate notes — ARIA logs them and spots repeat failures.']
  };
  function showEmpty(mod) {
    chat.innerHTML = '';
    const [t, d] = EMPTY[mod];
    chat.appendChild(el('div', 'ac-empty', `<strong>${t}</strong>${d}<br>Pick a suggestion below or type a question.`));
  }

  $$('.ac-mod').forEach(b => b.addEventListener('click', () => {
    stopAutoplay(true);
    if (busy) return;
    setModule(b.dataset.mod, true);
    openView('copilot');
  }));

  $('#ac-form').addEventListener('submit', e => {
    e.preventDefault();
    stopAutoplay(true);
    const input = $('#ac-input');
    const q = input.value.trim();
    if (!q || busy) return;
    input.value = '';
    const lower = q.toLowerCase();
    let best = null, score = 0;
    Object.entries(S).forEach(([id, sc]) => {
      const s = (sc.kw || []).filter(k => lower.includes(k)).length;
      if (s > score) { score = s; best = id; }
    });
    if (best) ask(best, q); else fallback(q);
  });

  // ---------- views ----------
  function openView(name) {
    $$('.ac-view-btn').forEach(b => {
      const on = b.dataset.acView === name;
      b.classList.toggle('active', on);
      b.setAttribute('aria-selected', on);
    });
    $$('.ac-view').forEach(v => {
      const on = v.dataset.acView === name;
      v.classList.toggle('active', on);
      v.hidden = !on;
    });
    if (name === 'reports') animateBars();
  }
  function openReports(tab) { openView('reports'); setRTab(tab); }
  $$('.ac-view-btn').forEach(b => b.addEventListener('click', () => { stopAutoplay(true); openView(b.dataset.acView); }));

  function setRTab(tab) {
    $$('.ac-rtab').forEach(b => b.classList.toggle('active', b.dataset.rtab === tab));
    $$('.ac-rpanel').forEach(p => p.classList.toggle('active', p.dataset.rtab === tab));
    if (tab === 'patterns') animateBars();
  }
  $$('.ac-rtab').forEach(b => b.addEventListener('click', () => setRTab(b.dataset.rtab)));

  // ---------- reports rendering ----------
  let filter = 'all';
  function renderReports() {
    const dt = logRows.reduce((s, r) => s + r.dt, 0);
    const open = actions.filter(a => !a.done).length;
    const repeats = logRows.filter(r => r.asset === 'Buff 2').length;
    $('#ac-kpis').innerHTML = [
      ['Interventions', logRows.length, ''],
      ['Downtime', dt, 'min'],
      ['MTTR', Math.round(dt / logRows.length), 'min'],
      ['Open actions', open, '', open > 0]
    ].map(([l, v, u, w]) => `<div class="ac-kpi${w ? ' warn' : ''}"><div class="ac-kpi-label">${l}</div><div class="ac-kpi-val">${v}<small>${u}</small></div></div>`).join('');

    const body = $('#ac-log-body');
    body.innerHTML = '';
    logRows.filter(r => filter === 'all' || r.type === filter).forEach(r => {
      const tr = el('tr', '', `<td>${r.time}</td><td>${r.asset}</td><td>${r.event}</td><td><span class="ac-type ${r.type}">${r.type}</span></td><td>${r.dt} min</td>`);
      tr.tabIndex = 0;
      const toggle = () => {
        const next = tr.nextElementSibling;
        if (next && next.classList.contains('ac-row-detail')) { next.remove(); return; }
        const p = patterns.find(x => x.asset === r.asset);
        const d = el('tr', 'ac-row-detail', `<td colspan="5">↳ ${p ? `${p.n} interventions on ${r.asset} in 30 days. ${p.note}` : 'No repeat pattern detected for this asset.'}</td>`);
        tr.after(d);
      };
      tr.addEventListener('click', toggle);
      tr.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); } });
      body.appendChild(tr);
    });
    if (!body.children.length) body.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--text-dim)">No events of this type this shift.</td></tr>';

    const ul = $('#ac-actions');
    ul.innerHTML = '';
    if (!actions.length) ul.appendChild(el('li', 'ac-act-empty', 'No open actions.'));
    actions.forEach((a, i) => {
      const li = el('li', a.done ? 'done' : '', `<span class="ac-type ${a.type}">${a.type}</span><span class="ac-act-text">${a.text}<small>${a.src}</small></span>`);
      const b = el('button', 'ac-action');
      b.type = 'button';
      b.textContent = a.done ? 'Reopen' : 'Mark done';
      b.addEventListener('click', () => { actions[i].done = !actions[i].done; renderReports(); toast(actions[i].done ? '✓ Action closed' : 'Action reopened'); });
      li.appendChild(b);
      ul.appendChild(li);
    });
    const badge = $('#ac-flag-count');
    badge.textContent = open;
    badge.hidden = open === 0;
  }

  $$('.ac-fbtn').forEach(b => b.addEventListener('click', () => {
    filter = b.dataset.filter;
    $$('.ac-fbtn').forEach(x => x.classList.toggle('active', x === b));
    renderReports();
  }));

  function renderBars() {
    const max = Math.max(...patterns.map(p => p.n));
    const box = $('#ac-bars');
    box.innerHTML = '';
    patterns.forEach((p, i) => {
      const b = el('button', 'ac-bar' + (i === 0 ? ' hot' : ''), `<span>${p.asset}</span><span class="ac-bar-track"><span class="ac-bar-fill" data-w="${p.n / max * 100}"></span></span><span class="ac-bar-n">${p.n}</span>`);
      b.type = 'button';
      b.addEventListener('click', () => {
        $$('.ac-bar', box).forEach(x => x.classList.toggle('active', x === b));
        const events = logRows.filter(r => r.asset === p.asset);
        $('#ac-bar-detail').innerHTML = `<strong>${p.asset}</strong> — ${p.note}` +
          (events.length ? `<ul>${events.map(e => `<li>${e.time} · ${e.event} (${e.dt} min)</li>`).join('')}</ul>` : '<br><em>No events this shift.</em>');
      });
      box.appendChild(b);
    });
    $('#ac-bar-detail').innerHTML = 'Select an asset to see details. <strong>Buff 2</strong> is highlighted as the top repeat offender.';
  }
  function animateBars() {
    const fills = $$('.ac-bar-fill');
    fills.forEach(f => { f.style.width = '0'; });
    requestAnimationFrame(() => requestAnimationFrame(() => fills.forEach(f => { f.style.width = f.dataset.w + '%'; })));
  }

  function addAction(text, type, src) {
    if (actions.some(a => a.text === text)) return;
    actions.unshift({ text, type: type || 'Electrical', done: false, src });
    renderReports();
    toast('⚑ Added to Open actions');
  }

  // ---------- export buttons ----------
  function summaryText() {
    const dt = logRows.reduce((s, r) => s + r.dt, 0);
    const lines = [
      'ARIA — SHIFT B REPORT (DEMO, FICTIONAL DATA)',
      `Interventions: ${logRows.length} | Downtime: ${dt} min | MTTR: ${Math.round(dt / logRows.length)} min`,
      '', 'EVENTS:',
      ...logRows.map(r => `  ${r.time}  ${r.asset.padEnd(11)} ${r.type.padEnd(11)} ${String(r.dt).padStart(3)} min  ${r.event}`),
      '', 'OPEN ACTIONS:',
      ...(actions.filter(a => !a.done).map(a => `  [ ] ${a.text}`)),
      '', 'TOP REPEAT ASSETS (30 d):',
      ...patterns.slice(0, 3).map(p => `  ${p.asset}: ${p.n} — ${p.note}`)
    ];
    return lines.join('\n');
  }
  $$('[data-report]').forEach(b => b.addEventListener('click', () => {
    const kind = b.dataset.report;
    if (kind === 'copy') {
      const txt = summaryText();
      (navigator.clipboard ? navigator.clipboard.writeText(txt) : Promise.reject())
        .then(() => toast('⧉ Summary copied to clipboard'))
        .catch(() => toast('Copy not available in this browser'));
    } else if (kind === 'download') {
      const blob = new Blob([summaryText()], { type: 'text/plain' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'aria-shift-report-demo.txt';
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
      toast('⤓ Report downloaded');
    } else if (kind === 'print') {
      window.print();
    }
  }));

  // ---------- toast ----------
  let toastTimer;
  function toast(msg) {
    const t = $('#ac-toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 2200);
  }

  // ---------- autoplay ----------
  const autoBtn = $('#ac-autoplay');
  let autoOn = false, autoIdx = 0, visible = false, loopId = 0;

  async function runAutoplay() {
    const me = ++loopId;
    while (autoOn && visible && me === loopId) {
      if (!busy) {
        const id = AUTOPLAY[autoIdx % AUTOPLAY.length];
        chat.innerHTML = '';
        await ask(id);
        autoIdx++;
      }
      await new Promise(r => setTimeout(r, 3500));
    }
  }
  function startAutoplay() {
    if (autoOn) return;
    autoOn = true;
    autoBtn.setAttribute('aria-pressed', 'true');
    autoBtn.textContent = '❚❚ Pause demo';
    openView('copilot');
    runAutoplay();
  }
  function stopAutoplay(byUser) {
    if (byUser) userTookOver = true;
    if (!autoOn) return;
    autoOn = false;
    autoBtn.setAttribute('aria-pressed', 'false');
    autoBtn.textContent = '▶ Auto demo';
  }
  autoBtn.addEventListener('click', () => {
    if (autoOn) stopAutoplay(true);
    else { userTookOver = false; startAutoplay(); }
  });

  // Start auto demo the first time the console scrolls into view (unless the user already interacted)
  new IntersectionObserver(entries => {
    entries.forEach(entry => {
      visible = entry.isIntersecting;
      if (visible && !userTookOver && !reduceMotion) startAutoplay();
      else if (!visible) stopAutoplay(false);
    });
  }, { threshold: 0.3 }).observe(root);

  // ---------- init ----------
  setModule('troubleshoot', true);
  renderReports();
  renderBars();
})();
