export function renderUI(): string {
  const today = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }).toLowerCase();
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Synthesis — Research Console</title>
<script src="https://cdn.tailwindcss.com"><\/script>
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=JetBrains+Mono:wght@400;500;600&family=Inter:wght@400;500;600&display=swap" rel="stylesheet" />
<style>
  :root {
    --paper: #f5e6c8; --paper-deep: #ecdab4; --paper-deeper: #e2cd9f;
    --ink: #2c1a0e; --ink-soft: #5a4028; --ink-faint: #8a6e4f; --ink-ghost: #b39871;
    --rule: #c9b48a; --rule-soft: #d8c69e;
    --accent: #7a3a14; --accent-warm: #b25a1f;
    --green: #4a6b2a; --amber: #a06622;
  }
  html, body { background: var(--paper); color: var(--ink); font-family: 'Inter', sans-serif; }
  body::before {
    content: ""; position: fixed; inset: 0; pointer-events: none; z-index: 1;
    background-image: radial-gradient(rgba(80,50,20,.035) 1px,transparent 1px), radial-gradient(rgba(80,50,20,.025) 1px,transparent 1px);
    background-size: 3px 3px, 7px 7px; background-position: 0 0, 1px 2px; mix-blend-mode: multiply;
  }
  .font-display { font-family: 'Fraunces', serif; font-optical-sizing: auto; }
  .font-mono { font-family: 'JetBrains Mono', monospace; }
  .label { font-family: 'JetBrains Mono', monospace; font-size: 10px; letter-spacing: .18em; text-transform: uppercase; color: var(--ink-faint); }
  .synth-prose { font-family: 'Fraunces', serif; font-weight: 400; font-size: 17px; line-height: 1.65; color: var(--ink); }
  .query-text {
    font-family: 'Fraunces', serif; font-style: italic; font-weight: 400; font-size: 14px; line-height: 1.5;
    color: var(--ink-soft); border-left: 2px solid var(--rule); padding-left: 12px; margin-left: -2px;
    display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
    cursor: pointer; transition: color .1s;
  }
  .query-text.expanded { display: block; overflow: visible; }
  .query-text:hover { color: var(--ink); }
  .cite {
    display: inline-flex; align-items: center; justify-content: center;
    min-width: 1.4em; height: 1.4em; padding: 0 .35em; margin: 0 .1em;
    font-family: 'JetBrains Mono', monospace; font-size: 10px; font-weight: 600;
    color: var(--accent); background: rgba(122,58,20,.08); border: 1px solid rgba(122,58,20,.25);
    border-radius: 3px; cursor: pointer; vertical-align: super; line-height: 1;
    transition: all .15s ease; user-select: none;
  }
  .cite:hover { background: rgba(122,58,20,.18); border-color: var(--accent); }
  .cite.active { background: var(--accent); color: var(--paper); border-color: var(--accent); }
  .source-row {
    display: grid; grid-template-columns: 28px 1fr; gap: 12px;
    padding: 10px 12px; border-radius: 4px; cursor: pointer;
    transition: background .15s ease; border: 1px solid transparent;
  }
  .source-row:hover { background: rgba(122,58,20,.05); }
  .source-row.highlighted { background: rgba(122,58,20,.12); border-color: rgba(122,58,20,.3); }
  .source-row .num { font-family: 'JetBrains Mono', monospace; font-size: 11px; font-weight: 600; color: var(--accent); padding-top: 2px; }
  .tape-entry {
    position: relative; padding: 10px 14px;
    border: 1px solid var(--rule-soft); background: rgba(255,248,230,.4);
    border-radius: 3px; transition: all .15s ease; cursor: pointer; user-select: none;
  }
  .tape-entry:hover:not(.faded) { background: rgba(122,58,20,.05); border-color: var(--rule); }
  .tape-entry.faded { opacity: .45; background: transparent; }
  .tape-entry.faded:hover { opacity: .65; }
  .tape-entry.in-window { border-color: var(--accent); background: rgba(178,90,31,.08); }
  .tape-entry.tape-focused { border-color: var(--accent) !important; background: rgba(122,58,20,.14) !important; box-shadow: inset 2px 0 0 var(--accent); }
  .tape-bracket { position: absolute; left: -10px; width: 6px; border: 2px solid var(--accent); pointer-events: none; }
  .tape-bracket.top { border-bottom: none; border-right: none; height: 14px; top: -2px; }
  .tape-bracket.bottom { border-top: none; border-right: none; height: 14px; bottom: -2px; }
  .tape-bracket.right-top { left: auto; right: -10px; border-bottom: none; border-left: none; height: 14px; top: -2px; }
  .tape-bracket.right-bottom { left: auto; right: -10px; border-top: none; border-left: none; height: 14px; bottom: -2px; }
  .src-dots { display: flex; align-items: center; gap: 2px; flex-shrink: 0; align-self: center; }
  .src-dot { width: 4px; height: 4px; border-radius: 50%; background: var(--ink-faint); flex-shrink: 0; }
  .src-dot.active-dot { background: var(--accent-warm); }
  .tape-query-text { font-family: 'Fraunces', serif; font-style: italic; font-size: 11px; line-height: 1.4; color: var(--ink-soft); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-top: 2px; }
  .pill { display: inline-flex; align-items: center; gap: 6px; padding: 3px 9px; border-radius: 999px; font-family: 'JetBrains Mono', monospace; font-size: 10px; font-weight: 500; letter-spacing: .04em; border: 1px solid; }
  .pill .dot { width: 6px; height: 6px; border-radius: 50%; }
  .ground-track { height: 6px; background: var(--paper-deeper); border-radius: 999px; overflow: hidden; border: 1px solid var(--rule-soft); }
  .ground-fill { height: 100%; border-radius: 999px; background: linear-gradient(90deg,#8b3a1a 0%,#6b6b2a 55%,#2d5a1b 100%); }
  .query-input { background: rgba(255,248,230,.6); border: 1px solid var(--rule); color: var(--ink); font-family: 'Fraunces', serif; font-size: 16px; }
  .query-input::placeholder { color: var(--ink-ghost); font-style: italic; }
  .query-input:focus { outline: none; border-color: var(--accent); background: rgba(255,252,240,.8); }
  .submit-btn { background: var(--ink); color: var(--paper); font-family: 'JetBrains Mono', monospace; font-size: 11px; letter-spacing: .12em; text-transform: uppercase; transition: background .15s ease; }
  .submit-btn:hover:not(:disabled) { background: var(--accent); }
  .submit-btn:disabled { opacity: .4; cursor: not-allowed; }
  .chat-scroll::-webkit-scrollbar, .inspector-scroll::-webkit-scrollbar { width: 6px; }
  .chat-scroll::-webkit-scrollbar-track, .inspector-scroll::-webkit-scrollbar-track { background: transparent; }
  .chat-scroll::-webkit-scrollbar-thumb, .inspector-scroll::-webkit-scrollbar-thumb { background: var(--rule); border-radius: 999px; }
  .section-header { display: flex; align-items: baseline; justify-content: space-between; padding-bottom: 12px; border-bottom: 1px solid var(--rule-soft); }
  .msg-divider { height: 1px; background: linear-gradient(90deg,transparent 0%,var(--rule) 50%,transparent 100%); margin: 32px 0; }
  .drawer-backdrop { background: rgba(44,26,14,.4); }
  .ornament { color: var(--ink-ghost); font-family: 'Fraunces', serif; font-style: italic; font-size: 11px; }
  .panel-divider { background: var(--rule); width: 1px; }
  *:focus-visible { outline: 1px solid var(--accent); outline-offset: 2px; }
  .tip { position: relative; cursor: help; }
  .tip[data-tip]::before, .tip[data-tip]::after { position: absolute; opacity: 0; pointer-events: none; transition: opacity .15s ease .2s, transform .15s ease .2s; z-index: 50; }
  .tip[data-tip]::before { content: attr(data-tip); bottom: calc(100% + 10px); left: 50%; transform: translateX(-50%) translateY(4px); width: max-content; max-width: 220px; padding: 8px 11px; background: #2c1a0e; color: #f5e6c8; font-family: 'Fraunces', serif; font-style: italic; font-size: 12px; font-weight: 400; line-height: 1.45; border-radius: 3px; box-shadow: 0 4px 12px rgba(44,26,14,.25); white-space: normal; text-align: left; text-transform: none; letter-spacing: 0; }
  .tip[data-tip]::after { content: ""; bottom: calc(100% + 4px); left: 50%; transform: translateX(-50%) translateY(4px); border: 6px solid transparent; border-top-color: #2c1a0e; border-bottom: 0; }
  .tip[data-tip]:hover::before, .tip[data-tip]:hover::after, .tip[data-tip]:focus-visible::before, .tip[data-tip]:focus-visible::after { opacity: 1; transform: translateX(-50%) translateY(0); }
  .empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; gap: 12px; opacity: .5; }
</style>
</head>
<body class="min-h-screen relative">

<button id="drawerToggle" class="lg:hidden fixed bottom-24 right-4 z-30 w-12 h-12 rounded-full bg-[#2c1a0e] text-[#f5e6c8] shadow-lg flex items-center justify-center font-mono text-xs tracking-widest">◐</button>

<div class="relative z-10 flex h-screen overflow-hidden">

  <!-- CHAT PANEL -->
  <main class="flex-1 lg:w-[65%] flex flex-col min-w-0">
    <header class="px-6 lg:px-12 pt-8 pb-6 border-b border-[#c9b48a]/60">
      <div class="flex items-center justify-between">
        <div class="flex items-baseline gap-4">
          <h1 class="font-display text-2xl lg:text-3xl font-semibold" style="letter-spacing:-.02em;">Synthesis</h1>
          <span class="ornament hidden sm:inline">— a research console</span>
        </div>
        <div class="flex items-center gap-4">
          <span class="label hidden sm:inline">session · ${today}</span>
          <span class="font-mono text-[10px] px-2 py-0.5 border border-[#c9b48a] rounded-sm text-[#5a4028]">v0.3</span>
        </div>
      </div>
    </header>

    <div id="chatScroll" class="chat-scroll flex-1 overflow-y-auto px-6 lg:px-12 py-8">
      <div id="messages" class="max-w-2xl mx-auto">
        <div class="empty-state" id="emptyState">
          <span class="font-display text-lg italic" style="color:var(--ink-faint);">Ask the corpus to begin</span>
          <span class="label">arXiv · open access papers</span>
        </div>
      </div>
    </div>

    <div class="px-6 lg:px-12 py-5 border-t border-[#c9b48a]/60 bg-[#f5e6c8]">
      <div class="max-w-2xl mx-auto">
        <div class="flex items-end gap-3">
          <div class="flex-1">
            <div class="label mb-1.5">Query <span id="charCount" class="ml-2"></span></div>
            <textarea id="queryInput" rows="1" placeholder="Ask the corpus…" maxlength="500" class="query-input w-full px-4 py-3 rounded-sm resize-none"></textarea>
          </div>
          <button id="submitBtn" class="submit-btn px-5 py-3 rounded-sm">Synthesise →</button>
        </div>
        <div class="flex items-center justify-between mt-2 px-1">
          <span class="label">⌘ + return to submit</span>
          <span class="label" id="sessionLabel"></span>
        </div>
      </div>
    </div>
  </main>

  <div class="panel-divider hidden lg:block"></div>

  <!-- INSPECTOR PANEL -->
  <aside id="inspector" class="hidden lg:flex lg:w-[35%] flex-col bg-[#f5e6c8]">
    <div class="inspector-scroll overflow-y-auto h-full px-6 py-8">
      <div class="flex items-baseline justify-between mb-8">
        <h2 class="font-display text-base font-semibold tracking-tight">Inspector</h2>
        <span class="label">live</span>
      </div>

      <section class="mb-10">
        <div class="section-header mb-4">
          <div class="flex items-baseline gap-3">
            <span class="font-mono text-[10px] text-[#8a6e4f]">01</span>
            <h3 class="font-display text-sm font-semibold uppercase tracking-widest">Sources</h3>
          </div>
          <span class="label" id="sourceCount">—</span>
        </div>
        <div id="sourcesList" class="space-y-1">
          <span class="label">no synthesis yet</span>
        </div>
      </section>

      <section class="mb-10">
        <div class="section-header mb-4">
          <div class="flex items-baseline gap-3">
            <span class="font-mono text-[10px] text-[#8a6e4f]">02</span>
            <h3 class="font-display text-sm font-semibold uppercase tracking-widest tip" tabindex="0"
              data-tip="The model attends to the 2 most recent syntheses. Bracketed entries are in context. Faded entries are evicted — still navigable, but no longer influencing responses.">Context Window</h3>
          </div>
          <button id="tapeQueryToggle" class="label hover:text-[#5a4028] transition-colors" style="cursor:pointer;background:none;border:none;padding:0;">show queries</button>
        </div>
        <div id="tapeWindow" class="space-y-2 pl-3 pr-3 relative">
          <span class="label">no entries yet</span>
        </div>
      </section>

      <section>
        <div class="section-header mb-4">
          <div class="flex items-baseline gap-3">
            <span class="font-mono text-[10px] text-[#8a6e4f]">03</span>
            <h3 class="font-display text-sm font-semibold uppercase tracking-widest">Groundedness</h3>
          </div>
          <span class="font-mono text-2xl font-semibold" id="groundednessValue">—</span>
        </div>
        <div class="space-y-2">
          <div class="ground-track"><div class="ground-fill" id="groundednessBar" style="width:0%;"></div></div>
          <div class="flex justify-between font-mono text-[9px] text-[#8a6e4f] tracking-widest">
            <span>0</span>
            <span class="tip" tabindex="0" data-tip="Proportion of synthesis sentences with direct source backing via embedding similarity. Indicative signal, not a precise measurement.">what is this?</span>
            <span>100</span>
          </div>
        </div>
      </section>

      <div class="mt-12 pt-6 border-t border-[#c9b48a]/60 text-center">
        <div class="ornament">— fin —</div>
      </div>
    </div>
  </aside>
</div>

<div id="drawerBackdrop" class="hidden fixed inset-0 z-20 drawer-backdrop"></div>

<script>
  // ============ STATE ============
  let messages = [];
  let sessionId = null;
  let inspectorFocus = -1;
  let tapeShowQueries = false;
  const ACTIVE_WINDOW_SIZE = 2;

  // ============ API ============
  async function handleSubmit() {
    const input = document.getElementById('queryInput');
    const q = input.value.trim();
    if (!q) return;

    const btn = document.getElementById('submitBtn');
    btn.disabled = true;
    btn.textContent = 'Searching…';

    try {
      const res = await fetch('/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q, session_id: sessionId }),
      });

      if (!res.ok) {
        const err = await res.text();
        throw new Error(err);
      }

      const data = await res.json();
      sessionId = data.session_id;

      messages.push({
        query: q,
        synthesis: data.synthesis,
        groundedness: Math.round(data.groundedness * 100),
        sources: (data.sources || []).map(s => ({ idx: s.index, title: s.title, arxiv_id: s.arxiv_id })),
      });

      inspectorFocus = messages.length - 1;

      input.value = '';
      input.style.height = 'auto';
      updateCharCount(0);

      document.getElementById('emptyState')?.remove();
      document.getElementById('sessionLabel').textContent = 'session ' + sessionId + ' · ' + data.total_this_session + ' syntheses';

      renderMessages();
      renderSources(messages[inspectorFocus]);
      renderTape();
      updateGroundedness(messages[inspectorFocus].groundedness);

      const scroll = document.getElementById('chatScroll');
      scroll.scrollTop = scroll.scrollHeight;
    } catch (e) {
      alert('Error: ' + e.message);
    } finally {
      btn.disabled = false;
      btn.textContent = 'Synthesise →';
    }
  }

  // ============ RENDER MESSAGES ============
  function renderMessages() {
    const container = document.getElementById('messages');
    container.innerHTML = '';

    messages.forEach((msg, i) => {
      const wrapper = document.createElement('div');
      wrapper.className = 'mb-2';
      wrapper.dataset.msgIdx = i;

      const synthesisHtml = msg.synthesis.replace(
        /\\[(\\d+)\\]/g,
        (_, num) => '<span class="cite" data-msg="' + i + '" data-cite="' + num + '">[' + num + ']<\\/span>'
      );

      const pillColor = groundedColor(msg.groundedness);

      wrapper.innerHTML =
        '<div class="flex items-baseline gap-3 mb-3">' +
          '<span class="font-mono text-[10px] text-[#8a6e4f] flex-shrink-0 pt-0.5">' + String(i+1).padStart(2,'0') + '<\\/span>' +
          '<p class="query-text">' + escHtml(msg.query) + '<\\/p>' +
        '<\\/div>' +
        '<p class="synth-prose mb-4">' + synthesisHtml + '<\\/p>' +
        '<div class="flex items-center gap-2">' +
          '<span class="pill" style="background:' + pillColor.bg + ';color:' + pillColor.fg + ';border-color:' + pillColor.border + ';">' +
            '<span class="dot" style="background:' + pillColor.fg + ';"><\\/span>' +
            msg.groundedness + '% grounded' +
          '<\\/span>' +
          '<span class="label">' + msg.sources.length + ' sources<\\/span>' +
        '<\\/div>' +
        (i < messages.length - 1 ? '<div class="msg-divider"><\\/div>' : '');

      container.appendChild(wrapper);
    });

    document.querySelectorAll('.cite').forEach(el => {
      el.addEventListener('click', () => {
        const msgIdx = parseInt(el.dataset.msg);
        const citeNum = parseInt(el.dataset.cite);
        const wasActive = el.classList.contains('active');
        document.querySelectorAll('.cite.active').forEach(c => c.classList.remove('active'));
        if (wasActive) {
          renderSources(messages[msgIdx]);
        } else {
          renderSources(messages[msgIdx], citeNum);
          el.classList.add('active');
        }
        inspectorFocus = msgIdx;
        updateGroundedness(messages[msgIdx].groundedness);
        renderTape();
      });
    });

    document.querySelectorAll('.query-text').forEach(el => {
      el.addEventListener('click', () => el.classList.toggle('expanded'));
    });
  }

  // ============ RENDER SOURCES ============
  function renderSources(msg, highlightIdx) {
    const list = document.getElementById('sourcesList');
    const count = document.getElementById('sourceCount');
    list.innerHTML = '';
    count.textContent = msg.sources.length + ' papers';

    msg.sources.forEach(src => {
      const row = document.createElement('div');
      row.className = 'source-row' + (highlightIdx === src.idx ? ' highlighted' : '');
      row.innerHTML =
        '<div class="num">[' + src.idx + ']<\\/div>' +
        '<div>' +
          '<div class="font-display text-[13px] leading-snug text-[#2c1a0e]" style="font-weight:500;">' + escHtml(src.title) + '<\\/div>' +
          '<a href="https://arxiv.org/abs/' + escHtml(src.arxiv_id) + '" target="_blank" class="label mt-1 hover:text-[#5a4028] transition-colors" style="text-decoration:none;">arxiv · ' + escHtml(src.arxiv_id) + '<\\/a>' +
        '<\\/div>';

      const msgIdx = messages.indexOf(msg);
      row.addEventListener('click', () => {
        const wasHighlighted = row.classList.contains('highlighted');
        document.querySelectorAll('.source-row').forEach(r => r.classList.remove('highlighted'));
        document.querySelectorAll('.cite.active').forEach(c => c.classList.remove('active'));
        if (!wasHighlighted) {
          row.classList.add('highlighted');
          const matching = document.querySelector('.cite[data-msg="' + msgIdx + '"][data-cite="' + src.idx + '"]');
          if (matching) matching.classList.add('active');
        }
      });
      list.appendChild(row);
    });
  }

  // ============ RENDER TAPE ============
  function renderTape() {
    const tape = document.getElementById('tapeWindow');
    tape.innerHTML = '';
    const total = messages.length;
    if (total === 0) { tape.innerHTML = '<span class="label">no entries yet<\\/span>'; return; }
    const windowStart = Math.max(0, total - ACTIVE_WINDOW_SIZE);

    const toggle = document.getElementById('tapeQueryToggle');
    if (toggle) toggle.textContent = tapeShowQueries ? 'hide queries' : 'show queries';

    messages.forEach((msg, i) => {
      const inWindow = i >= windowStart;
      const isFocused = i === inspectorFocus;

      const entry = document.createElement('div');
      entry.className = 'tape-entry' + (inWindow ? ' in-window' : ' faded') + (isFocused ? ' tape-focused' : '');

      let bracketsHtml = '';
      if (i === windowStart) bracketsHtml += '<div class="tape-bracket top"><\\/div><div class="tape-bracket right-top"><\\/div>';
      if (i === total - 1 && inWindow) bracketsHtml += '<div class="tape-bracket bottom"><\\/div><div class="tape-bracket right-bottom"><\\/div>';

      const maxDots = 4;
      let dotsInner = '';
      for (let d = 0; d < Math.min(msg.sources.length, maxDots); d++) {
        dotsInner += '<span class="src-dot' + (inWindow ? ' active-dot' : '') + '"><\\/span>';
      }
      if (msg.sources.length > maxDots) dotsInner += '<span class="font-mono text-[8px] text-[#8a6e4f]">+' + (msg.sources.length - maxDots) + '<\\/span>';

      const dotsHtml = '<div class="src-dots tip" tabindex="-1" data-tip="' + msg.sources.length + ' source' + (msg.sources.length !== 1 ? 's' : '') + ' · ' + msg.groundedness + '% grounded" style="cursor:default;">' + dotsInner + '<\\/div>';
      const queryHtml = tapeShowQueries ? '<div class="tape-query-text mt-1.5">' + escHtml(msg.query) + '<\\/div>' : '';

      entry.innerHTML = bracketsHtml +
        '<div class="flex items-center gap-2">' +
          '<span class="font-mono text-[10px] font-semibold flex-shrink-0" style="color:' + (isFocused ? 'var(--accent)' : inWindow ? 'var(--ink-soft)' : 'var(--ink-faint)') + ';">#' + String(i+1).padStart(2,'0') + '<\\/span>' +
          '<span class="font-mono text-[8px] tracking-widest flex-shrink-0" style="color:' + (inWindow ? (isFocused ? 'var(--accent)' : '#7a3a14') : 'var(--ink-ghost)') + ';">' + (inWindow ? 'ACTIVE' : 'EVICT') + '<\\/span>' +
          '<span class="flex-1"><\\/span>' +
          dotsHtml +
        '<\\/div>' + queryHtml;

      const jumpTo = (idx) => {
        inspectorFocus = idx;
        renderTape();
        renderSources(messages[idx]);
        updateGroundedness(messages[idx].groundedness);
        document.querySelectorAll('.cite.active').forEach(c => c.classList.remove('active'));
        const msgEl = document.querySelector('[data-msg-idx="' + idx + '"]');
        if (msgEl) msgEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      };

      entry.addEventListener('click', () => jumpTo(i));
      entry.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); jumpTo(i); } });
      tape.appendChild(entry);
    });
  }

  // ============ GROUNDEDNESS ============
  function updateGroundedness(score) {
    document.getElementById('groundednessValue').textContent = score + '%';
    document.getElementById('groundednessBar').style.width = score + '%';
  }

  function groundedColor(score) {
    if (score >= 88) return { bg: 'rgba(45,90,27,.13)', fg: '#2d5a1b', border: 'rgba(45,90,27,.45)' };
    if (score >= 75) return { bg: 'rgba(78,104,32,.13)', fg: '#4e6820', border: 'rgba(78,104,32,.45)' };
    if (score >= 60) return { bg: 'rgba(107,107,42,.13)', fg: '#6b6b2a', border: 'rgba(107,107,42,.45)' };
    if (score >= 45) return { bg: 'rgba(138,85,32,.13)', fg: '#8a5520', border: 'rgba(138,85,32,.45)' };
    return { bg: 'rgba(139,58,26,.13)', fg: '#8b3a1a', border: 'rgba(139,58,26,.45)' };
  }

  function escHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }

  // ============ CHAR COUNT ============
  function updateCharCount(n) {
    const el = document.getElementById('charCount');
    if (n === 0) { el.textContent = ''; return; }
    el.textContent = n + '/500';
    el.style.color = n > 450 ? 'var(--accent)' : 'var(--ink-faint)';
  }

  // ============ MOBILE DRAWER ============
  const drawerToggle = document.getElementById('drawerToggle');
  const drawerBackdrop = document.getElementById('drawerBackdrop');
  const inspector = document.getElementById('inspector');

  function openDrawer() {
    inspector.classList.remove('hidden');
    inspector.classList.add('flex','fixed','inset-y-0','right-0','w-[85%]','max-w-md','z-30','shadow-2xl');
    drawerBackdrop.classList.remove('hidden');
  }
  function closeDrawer() {
    if (window.innerWidth < 1024) {
      inspector.classList.add('hidden');
      inspector.classList.remove('flex','fixed','inset-y-0','right-0','w-[85%]','max-w-md','z-30','shadow-2xl');
      drawerBackdrop.classList.add('hidden');
    }
  }
  drawerToggle.addEventListener('click', () => inspector.classList.contains('hidden') ? openDrawer() : closeDrawer());
  drawerBackdrop.addEventListener('click', closeDrawer);
  window.addEventListener('resize', () => {
    if (window.innerWidth >= 1024) {
      inspector.classList.remove('hidden','fixed','inset-y-0','right-0','w-[85%]','max-w-md','z-30','shadow-2xl');
      inspector.classList.add('flex');
      drawerBackdrop.classList.add('hidden');
    }
  });

  // ============ INPUT WIRING ============
  document.getElementById('submitBtn').addEventListener('click', handleSubmit);

  const ta = document.getElementById('queryInput');
  ta.addEventListener('input', () => {
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 120) + 'px';
    updateCharCount(ta.value.length);
  });
  ta.addEventListener('keydown', e => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') { e.preventDefault(); handleSubmit(); }
  });

  document.getElementById('tapeQueryToggle').addEventListener('click', () => {
    tapeShowQueries = !tapeShowQueries;
    renderTape();
  });
<\/script>
</body>
</html>`;
}
