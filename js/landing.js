(() => {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function toast(message) {
    const host = document.getElementById('toasts');
    if (!host) return;
    const el = document.createElement('div');
    el.className = 'toast';
    el.textContent = message;
    host.appendChild(el);
    window.setTimeout(() => el.remove(), 2300);
  }

  async function copyText(text) {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch (_) {}
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand('copy');
      ta.remove();
      return ok;
    } catch (_) {
      return false;
    }
  }

  document.querySelectorAll('[data-copy]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const code = document.getElementById(btn.dataset.copy);
      if (!code) return;
      const original = btn.textContent;
      const ok = await copyText(code.textContent.trim());
      if (ok) {
        btn.classList.add('is-copied');
        btn.textContent = 'Copied';
        toast('Command copied to clipboard');
        window.setTimeout(() => {
          btn.classList.remove('is-copied');
          btn.textContent = original;
        }, 1400);
      }
    });
  });

  /* ---------- Sticky Nav Scroll Highlight ---------- */
  const navLinks = Array.from(document.querySelectorAll('.nav a'));
  const navSections = ['overview', 'sync', 'launcher', 'stack', 'install']
    .map((id) => document.getElementById(id))
    .filter(Boolean);

  function setActiveNav(id) {
    navLinks.forEach((link) => link.classList.toggle('active', link.dataset.nav === id));
  }

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActiveNav(visible.target.id);
      },
      { rootMargin: '-20% 0px -60% 0px', threshold: [0, 0.25, 0.5] },
    );
    navSections.forEach((sec) => observer.observe(sec));
  }

  /* ---------- Hero Launcher Mockup & Live Post-Close Auto-Sync ---------- */
  const games = ['Fogwoods', 'Cyber Runner 2077', 'Hollow Spire'];
  const logs = [
    { title: 'Auto-synced Fogwoods', detail: '2 files uploaded (184 KB), 312 unchanged' },
    { title: 'Closed Fogwoods', detail: 'Played 42m, Proton inactive' },
  ];

  const popList = document.getElementById('lw-pop-list');
  const popEl = document.getElementById('lw-activity-popover');
  const activityBtn = document.getElementById('lw-activity-btn');
  const activityLabel = document.getElementById('lw-activity-label');
  const activityCount = document.getElementById('lw-activity-count');
  const sessionNote = document.getElementById('lw-session-note');
  const syncBanner = document.getElementById('lw-sync-banner');
  const syncTitle = document.getElementById('lw-sync-title');
  const syncSub = document.getElementById('lw-sync-sub');
  const syncSpinner = document.getElementById('lw-sync-spinner');

  function renderHeroLogs() {
    if (activityCount) activityCount.textContent = String(logs.length);
    if (!popList) return;
    popList.innerHTML = logs
      .slice(0, 6)
      .map(
        (entry) =>
          `<div class="lw-pop-row"><strong>${entry.title}</strong><span>${entry.detail}</span></div>`,
      )
      .join('');
  }
  renderHeroLogs();

  activityBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    const next = popEl.hidden;
    popEl.hidden = !next;
    activityBtn.setAttribute('aria-expanded', String(next));
  });

  document.getElementById('lw-pop-close')?.addEventListener('click', () => {
    popEl.hidden = true;
    activityBtn?.setAttribute('aria-expanded', 'false');
  });

  let simActive = false;
  function simulatePlaySession(idx) {
    if (simActive) return;
    simActive = true;
    const name = games[idx] || 'Fogwoods';
    const badge = document.querySelector(`[data-card-badge="${idx}"]`);
    const prevText = badge ? badge.textContent : 'Synced';
    const prevClass = badge ? badge.className : '';

    logs.unshift({ title: `Started ${name}`, detail: idx === 1 ? 'Runtime: GE-Proton9-25' : 'Runtime: native' });
    renderHeroLogs();

    if (badge) {
      badge.textContent = 'Playing';
      badge.className = 'capsule-state state-playing';
    }
    if (sessionNote) sessionNote.textContent = `${name} is running. Session active...`;

    window.setTimeout(() => {
      if (badge) {
        badge.textContent = 'Syncing...';
        badge.className = 'capsule-state state-pending';
      }
      activityBtn?.classList.add('is-syncing');
      if (activityLabel) activityLabel.textContent = 'Syncing saves';
      if (sessionNote) sessionNote.textContent = `${name} closed. Auto-syncing modified save files...`;

      logs.unshift({ title: `Closed ${name}`, detail: 'Played 18m, checking local saves' });
      renderHeroLogs();

      if (syncBanner && syncTitle && syncSub && syncSpinner) {
        syncSpinner.classList.remove('is-done');
        syncTitle.textContent = `Closed ${name}`;
        syncSub.textContent = 'Scanning saves and uploading changed 4 MB chunks...';
        syncBanner.hidden = false;
      }

      window.setTimeout(() => {
        if (badge) {
          badge.textContent = 'Synced';
          badge.className = prevClass.includes('state-proton') ? 'capsule-state state-proton' : 'capsule-state state-synced';
          if (idx === 1) badge.textContent = 'Synced (Proton)';
        }
        activityBtn?.classList.remove('is-syncing');
        if (activityLabel) activityLabel.textContent = 'Activity';
        if (sessionNote) sessionNote.textContent = `Saves synced for ${name}. Click Play on any game to test again.`;

        logs.unshift({ title: `Auto-synced ${name}`, detail: '2 changed files uploaded (240 KB)' });
        renderHeroLogs();

        if (syncSpinner && syncTitle && syncSub) {
          syncSpinner.classList.add('is-done');
          syncTitle.textContent = `Saves synced for ${name}`;
          syncSub.textContent = '2 changed files uploaded (240 KB)';
        }

        window.setTimeout(() => {
          if (syncBanner) syncBanner.hidden = true;
          if (badge) badge.textContent = prevText === '1 queued' ? 'Synced' : badge.textContent;
          simActive = false;
        }, 2200);
      }, 1250);
    }, 1150);
  }

  document.querySelectorAll('.capsule-card').forEach((card) => {
    const idx = Number(card.dataset.game || 0);
    card.addEventListener('pointermove', (event) => {
      if (reduceMotion) return;
      const rect = card.getBoundingClientRect();
      const nx = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
      const ny = Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height));
      card.style.setProperty('--ry', ((nx - 0.5) * 10).toFixed(2) + 'deg');
      card.style.setProperty('--rx', ((0.5 - ny) * 8).toFixed(2) + 'deg');
      card.style.setProperty('--gx', (nx * 100).toFixed(1) + '%');
      card.style.setProperty('--gy', (ny * 100).toFixed(1) + '%');
    });
    card.addEventListener('pointerleave', () => {
      card.style.setProperty('--rx', '0deg');
      card.style.setProperty('--ry', '0deg');
    });
    card.addEventListener('click', () => simulatePlaySession(idx));
  });

  document.getElementById('lw-fab-upload')?.addEventListener('click', (e) => {
    e.stopPropagation();
    document.querySelector('[data-console="uploads"]')?.click();
    document.getElementById('launcher')?.scrollIntoView({ behavior: 'smooth' });
  });

  /* ---------- Differential Sync Explorer ---------- */
  const diffFiles = [
    { dir: 'Binaries/', name: 'Game.exe', size: '42.6 MB' },
    { dir: 'Content/', name: 'world_assets.pak', size: '2.10 GB' },
    { dir: 'Content/', name: 'audio_bank.pak', size: '1.45 GB' },
    { dir: 'Saves/', name: 'slot_01.sav', size: '192 KB' },
    { dir: 'Saves/', name: 'controls.ini', size: '4 KB' },
    { dir: 'Saves/', name: 'autosave_thumb.png', size: '820 KB' },
  ];

  const diffModes = {
    clean: {
      title: 'Clean manifest',
      meta: '6 files hashed',
      note: 'Uploaded once as the shared baseline for every player. Files stay as an ordinary folder on disk and their SHA-256 manifest never mutates.',
      states: {},
    },
    usera: {
      title: 'Player A overlay',
      meta: '2 modified saves sent',
      note: 'Player A only uploads changed files relative to the clean manifest. Unchanged gigabyte .pak files are skipped cleanly.',
      states: { 'slot_01.sav': ['change', 'Modified, 1 chunk sent'], 'controls.ini': ['change', 'Modified, 1 chunk sent'] },
    },
    userb: {
      title: 'Player B overlay',
      meta: '1 modified, 1 deleted',
      note: 'Player B maintains an independent save overlay plus deletions.json bound to the current manifest hash.',
      states: { 'slot_01.sav': ['change', 'Modified, 1 chunk sent'], 'autosave_thumb.png': ['delete', 'Recorded in deletions.json'] },
    },
    merge: {
      title: 'On-the-fly streaming zip',
      meta: 'clean + overlay minus deletions',
      note: 'At download time, the server streams STORE entries in sorted path order directly from clean files plus Player B overlay, excluding deleted files with no temporary zip file.',
      states: {
        'Game.exe': ['stream', 'Streamed from clean'],
        'world_assets.pak': ['stream', 'Streamed from clean'],
        'audio_bank.pak': ['stream', 'Streamed from clean'],
        'slot_01.sav': ['change', 'Substituted from overlay'],
        'controls.ini': ['stream', 'Streamed from clean'],
        'autosave_thumb.png': ['delete', 'Excluded at download'],
      },
    },
  };

  const diffTitle = document.getElementById('diff-title');
  const diffMeta = document.getElementById('diff-meta');
  const diffNote = document.getElementById('diff-note');
  const diffRows = document.getElementById('diff-rows');

  function renderDiff(mode) {
    const cfg = diffModes[mode];
    if (!cfg || !diffRows) return;
    if (diffTitle) diffTitle.textContent = cfg.title;
    if (diffMeta) diffMeta.textContent = cfg.meta;
    if (diffNote) diffNote.textContent = cfg.note;
    diffRows.innerHTML = diffFiles
      .map((f) => {
        const [cls, label] = cfg.states[f.name] || ['skip', 'Unchanged'];
        return `<div class="diff-row">
          <div class="diff-path"><span>${f.dir}</span>${f.name}</div>
          <div class="diff-size">${f.size}</div>
          <div class="diff-status is-${cls}">${label}</div>
        </div>`;
      })
      .join('');
  }

  document.querySelectorAll('.diff-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.diff-tab').forEach((t) => {
        const active = t === tab;
        t.classList.toggle('is-active', active);
        t.setAttribute('aria-selected', String(active));
      });
      renderDiff(tab.dataset.mode);
    });
  });
  renderDiff('clean');

  /* ---------- Launcher Feature Console Switcher ---------- */
  document.querySelectorAll('.console-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.console;
      document.querySelectorAll('.console-tab').forEach((t) => {
        const active = t === tab;
        t.classList.toggle('is-active', active);
        t.setAttribute('aria-selected', String(active));
      });
      document.querySelectorAll('.console-pane').forEach((pane) => {
        const active = pane.dataset.pane === target;
        pane.classList.toggle('is-active', active);
        pane.hidden = !active;
      });
    });
  });

  /* ---------- Live Download Waveform Canvas ---------- */
  const canvas = document.getElementById('wave-canvas');
  const waveWrap = document.getElementById('wave-wrap');
  const waveRate = document.getElementById('wave-rate');
  const waveStatus = document.getElementById('wave-status');
  const waveTooltip = document.getElementById('wave-tooltip');
  const ttRate = document.getElementById('tt-rate');
  const ttTime = document.getElementById('tt-time');
  const progressBar = document.getElementById('wave-progress-bar');
  const waveBytes = document.getElementById('wave-bytes');

  const waveSettings = {
    store: { label: 'Streaming uncompressed STORE zip straight to disk', color: '#7dfa9b', base: 98, jitter: 12 },
    throttle: { label: 'Transfer capped at 50 MB/s bandwidth limit', color: '#6bb3ff', base: 48, jitter: 4 },
    paused: { label: 'Transfer paused on disk', color: '#676e79', base: 0, jitter: 0 },
  };

  if (canvas && waveWrap) {
    const ctx = canvas.getContext('2d');
    const samples = new Array(110).fill(92);
    let mode = 'store';
    let cssW = 1;
    let cssH = 1;
    let smooth = 94;
    let phase = 0;
    let progress = 64;
    let bytes = 7.8;
    let scrubX = null;

    function resize() {
      const r = waveWrap.getBoundingClientRect();
      if (!r.width || !r.height) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      cssW = Math.floor(r.width);
      cssH = Math.floor(r.height);
      canvas.width = Math.floor(cssW * dpr);
      canvas.height = Math.floor(cssH * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function nextSample() {
      const cfg = waveSettings[mode];
      if (mode === 'paused') return smooth * 0.84;
      const target = Math.max(0, Math.min(118, cfg.base + Math.sin(phase) * 6 + (Math.random() - 0.5) * cfg.jitter));
      smooth += (target - smooth) * 0.3;
      return smooth;
    }

    function draw() {
      const cfg = waveSettings[mode];
      ctx.clearRect(0, 0, cssW, cssH);
      const step = cssW / (samples.length - 1);
      const yOf = (v) => cssH - (Math.max(0, Math.min(120, v)) / 120) * cssH;

      ctx.strokeStyle = 'rgba(255,255,255,0.045)';
      ctx.lineWidth = 1;
      for (let i = 1; i < 4; i++) {
        const y = Math.round((cssH / 4) * i) + 0.5;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(cssW, y);
        ctx.stroke();
      }

      const grad = ctx.createLinearGradient(0, 0, 0, cssH);
      grad.addColorStop(0, mode === 'throttle' ? 'rgba(107,179,255,0.24)' : mode === 'paused' ? 'rgba(103,110,121,0.14)' : 'rgba(125,250,155,0.26)');
      grad.addColorStop(1, 'rgba(0,0,0,0)');

      ctx.beginPath();
      ctx.moveTo(0, cssH);
      for (let i = 0; i < samples.length; i++) ctx.lineTo(i * step, yOf(samples[i]));
      ctx.lineTo(cssW, cssH);
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.fill();

      ctx.beginPath();
      for (let i = 0; i < samples.length; i++) {
        const x = i * step;
        const y = yOf(samples[i]);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = cfg.color;
      ctx.lineWidth = 2;
      ctx.stroke();

      if (scrubX !== null) {
        const idx = Math.max(0, Math.min(samples.length - 1, Math.round(scrubX / step)));
        ctx.strokeStyle = 'rgba(255,255,255,0.3)';
        ctx.beginPath();
        ctx.moveTo(idx * step, 0);
        ctx.lineTo(idx * step, cssH);
        ctx.stroke();
        if (ttRate && ttTime) {
          ttRate.textContent = samples[idx].toFixed(1) + ' MB/s';
          ttTime.textContent = idx === samples.length - 1 ? 'now' : ((samples.length - 1 - idx) / 30).toFixed(1) + 's ago';
        }
      }
    }

    let last = 0;
    function loop(now) {
      if (now - last > 33) {
        samples.push(nextSample());
        samples.shift();
        phase += 0.08;
        last = now;
        if (mode !== 'paused') {
          progress = progress >= 99 ? 42 : progress + (mode === 'store' ? 0.05 : 0.025);
          bytes = 12.2 * (progress / 100);
          if (progressBar) progressBar.style.width = progress.toFixed(1) + '%';
          if (waveBytes) waveBytes.textContent = `${bytes.toFixed(1)} / 12.2 GB`;
        }
        if (waveRate) waveRate.textContent = `${samples[samples.length - 1].toFixed(1)} MB/s`;
      }
      draw();
      window.requestAnimationFrame(loop);
    }

    if ('ResizeObserver' in window) new ResizeObserver(resize).observe(waveWrap);
    window.addEventListener('resize', resize);
    resize();
    window.requestAnimationFrame(loop);

    waveWrap.addEventListener('pointermove', (e) => {
      const r = waveWrap.getBoundingClientRect();
      scrubX = Math.min(r.width, Math.max(0, e.clientX - r.left));
      if (waveTooltip) {
        waveTooltip.hidden = false;
        waveTooltip.style.left = Math.min(r.width - 54, Math.max(54, scrubX)) + 'px';
        waveTooltip.style.top = Math.max(42, e.clientY - r.top) + 'px';
      }
    });
    waveWrap.addEventListener('pointerleave', () => {
      scrubX = null;
      if (waveTooltip) waveTooltip.hidden = true;
    });

    document.querySelectorAll('[data-wave-mode]').forEach((btn) => {
      btn.addEventListener('click', () => {
        mode = btn.dataset.waveMode;
        document.querySelectorAll('[data-wave-mode]').forEach((b) => b.classList.toggle('is-active', b === btn));
        if (waveStatus) waveStatus.textContent = waveSettings[mode].label;
        if (waveRate) waveRate.style.color = waveSettings[mode].color;
      });
    });
  }

  /* ---------- 6-Worker LPT Upload Demo ---------- */
  const workersHost = document.getElementById('upload-workers');
  const uploadStatus = document.getElementById('upload-status');
  const workerData = [
    { file: 'Data/world_main.pak', pct: 84 },
    { file: 'Data/textures_4k.pak', pct: 76 },
    { file: 'Data/audio_streams.bank', pct: 91 },
    { file: 'Movies/intro_cutscene.mp4', pct: 68 },
    { file: 'Binaries/CyberRunner.exe', pct: 100 },
    { file: 'Config/manifest_tree.dat', pct: 100 },
  ];

  function renderWorkers() {
    if (!workersHost) return;
    workersHost.innerHTML = workerData
      .map(
        (w, i) => `
      <div class="worker-row">
        <div class="worker-top">
          <strong>W${i + 1}: ${w.file}</strong>
          <span>${Math.round(w.pct)}%</span>
        </div>
        <div class="worker-bar"><i style="width:${w.pct}%"></i></div>
      </div>`,
      )
      .join('');
  }
  renderWorkers();

  let uploadTimer = 0;
  document.getElementById('btn-run-upload-demo')?.addEventListener('click', () => {
    if (uploadTimer) window.clearInterval(uploadTimer);
    workerData.forEach((w, i) => { w.pct = 12 + i * 6; });
    if (uploadStatus) uploadStatus.textContent = 'Streaming 4 MB chunks across 6 concurrent HTTP workers...';
    renderWorkers();
    uploadTimer = window.setInterval(() => {
      let allDone = true;
      workerData.forEach((w, i) => {
        if (w.pct < 100) {
          w.pct = Math.min(100, w.pct + 14 + (i % 3) * 4);
          allDone = false;
        }
      });
      renderWorkers();
      if (allDone) {
        window.clearInterval(uploadTimer);
        uploadTimer = 0;
        if (uploadStatus) uploadStatus.textContent = 'All chunks received. Server manifest indexed and ready.';
      }
    }, 240);
  });

  /* ---------- Crash Recovery & Safe Shutdown Demo ---------- */
  const recoveryConsole = document.getElementById('recovery-console');
  document.getElementById('btn-sim-crash')?.addEventListener('click', () => {
    if (!recoveryConsole) return;
    recoveryConsole.innerHTML = `
      <div class="recovery-card-title">Interrupted session detected for Fogwoods</div>
      <p class="recovery-card-copy">OpenSync closed unexpectedly while the game was running. Two modified save files were found in the game folder:</p>
      <div class="recovery-files">
        <span>saves/slot1.sav (184 KB modified)</span>
        <span>saves/autosave_checkpoint.dat (56 KB new)</span>
      </div>
      <div class="recovery-actions">
        <button type="button" class="btn btn-primary btn-sm" id="btn-demo-sync-now">Sync saves now</button>
        <button type="button" class="btn btn-secondary btn-sm" id="btn-demo-skip-sync">Skip save sync</button>
      </div>
    `;
    document.getElementById('btn-demo-sync-now')?.addEventListener('click', () => {
      recoveryConsole.innerHTML = '<div class="recovery-card-title" style="color:var(--signal);">Recovered and synced 2 save files</div><p class="recovery-card-copy">Overlay updated on the server and the interrupted session marker has been cleared from SQLite.</p>';
    });
    document.getElementById('btn-demo-skip-sync')?.addEventListener('click', () => {
      recoveryConsole.innerHTML = '<div class="recovery-card-title">Save recovery skipped</div><p class="recovery-card-copy">Local save files remain intact on disk without uploading.</p>';
    });
  });

  document.getElementById('btn-sim-shutdown')?.addEventListener('click', () => {
    if (!recoveryConsole) return;
    recoveryConsole.innerHTML = '<div class="recovery-card-title">Waiting for 1 active save sync before exit...</div><p class="recovery-card-copy">Pausing queued transfers and writing session heartbeats to disk.</p>';
    window.setTimeout(() => {
      recoveryConsole.innerHTML = '<div class="recovery-card-title" style="color:var(--signal);">Safe shutdown complete</div><p class="recovery-card-copy">In-flight save sync finished cleanly and SQLite WAL checkpointed via PRAGMA wal_checkpoint(TRUNCATE).</p>';
    }, 850);
  });

  /* ---------- Install Tabs ---------- */
  document.querySelectorAll('[data-install-tab]').forEach((tab) => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.installTab;
      document.querySelectorAll('[data-install-tab]').forEach((t) => {
        const active = t === tab;
        t.classList.toggle('is-active', active);
        t.setAttribute('aria-selected', String(active));
      });
      document.querySelectorAll('[data-install-pane]').forEach((pane) => {
        const active = pane.dataset.installPane === target;
        pane.classList.toggle('is-active', active);
        pane.hidden = !active;
      });
    });
  });
})();
