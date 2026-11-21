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
    window.setTimeout(() => {
      el.classList.add('out');
      window.setTimeout(() => el.remove(), 240);
    }, 2200);
  }

  async function copyText(text) {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch (_) {
      // fall through to the textarea fallback
    }
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

  function flashCopied(el, label) {
    const original = label ? el.innerHTML : null;
    el.classList.add('copied');
    if (label) el.innerHTML = '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12 4 4L19 6"/></svg>';
    window.setTimeout(() => {
      el.classList.remove('copied');
      if (original !== null) el.innerHTML = original;
    }, 1500);
  }

  /* ---------- nav active state ---------- */
  const navLinks = Array.from(document.querySelectorAll('.nav a'));
  const navSections = ['library', 'sync', 'launcher', 'deploy']
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
      { rootMargin: '-25% 0px -55% 0px', threshold: [0, 0.2, 0.5] }
    );
    navSections.forEach((section) => observer.observe(section));
  }
  navLinks.forEach((link) => link.addEventListener('click', () => setActiveNav(link.dataset.nav)));

  /* ---------- install pill ---------- */
  const installPill = document.getElementById('install-pill');
  const installCommand = document.getElementById('install-command');
  const installCopy = document.getElementById('install-copy');
  if (installPill && installCommand) {
    installPill.addEventListener('click', async () => {
      const ok = await copyText(installCommand.textContent.trim());
      if (installCopy) flashCopied(installCopy, true);
      toast(ok ? 'Install command copied' : 'Select the command to copy it');
    });
  }

  /* ---------- capsule cards ---------- */
  const gameData = [
    { name: 'Hollow Peak', state: 'Overlay current', size: '128 MB', sync: '4 minutes ago', badge: 'Ready to play' },
    { name: 'Neon Drift', state: 'Baseline only', size: '64 MB', sync: 'Not synced yet', badge: 'Installed clean' },
    { name: 'Emberfall', state: 'Save queued', size: '256 MB', sync: '2 days ago', badge: 'Sync on next launch' },
    { name: 'Deep Signal', state: 'Overlay current', size: '92 MB', sync: '18 hours ago', badge: 'Ready to play' },
    { name: 'Verdant', state: 'Baseline only', size: '48 MB', sync: 'Not synced yet', badge: 'Installed clean' },
    { name: 'Iron Meridian', state: 'Overlay current', size: '340 MB', sync: '1 hour ago', badge: 'Ready to play' }
  ];

  const previewName = document.getElementById('preview-name');
  const previewState = document.getElementById('preview-state');
  const previewSize = document.getElementById('preview-size');
  const previewSync = document.getElementById('preview-sync');
  const previewBadge = document.getElementById('preview-badge');
  const capsules = Array.from(document.querySelectorAll('.capsule-card'));

  capsules.forEach((card) => {
    const index = Number(card.dataset.game);
    let raf = 0;
    let tickerTimer = 0;
    let tickerIndex = 0;
    const ticker = card.querySelector('.card-stat-item');
    const stats = ticker ? ticker.dataset.stats.split(',') : [];

    card.addEventListener('pointermove', (event) => {
      if (raf) return;
      raf = window.requestAnimationFrame(() => {
        raf = 0;
        const rect = card.getBoundingClientRect();
        const nx = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
        const ny = Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height));
        card.style.setProperty('--ry', ((nx - 0.5) * 11).toFixed(2) + 'deg');
        card.style.setProperty('--rx', ((0.5 - ny) * 9).toFixed(2) + 'deg');
        card.style.setProperty('--gx', (nx * 100).toFixed(1) + '%');
        card.style.setProperty('--gy', (ny * 100).toFixed(1) + '%');
      });
    });

    const resetTilt = () => {
      card.style.setProperty('--rx', '3.5deg');
      card.style.setProperty('--ry', '-4.5deg');
      card.style.setProperty('--gx', '28%');
      card.style.setProperty('--gy', '22%');
      if (tickerTimer) window.clearInterval(tickerTimer);
      tickerTimer = 0;
      tickerIndex = 0;
      if (ticker && stats.length) {
        ticker.textContent = stats[0];
        ticker.classList.remove('is-entering');
        void ticker.offsetWidth;
        ticker.classList.add('is-entering');
      }
    };

    card.addEventListener('pointerleave', resetTilt);
    card.addEventListener('blur', resetTilt);

    card.addEventListener('pointerenter', () => {
      if (!ticker || stats.length < 2 || reduceMotion) return;
      tickerTimer = window.setInterval(() => {
        tickerIndex = (tickerIndex + 1) % stats.length;
        ticker.classList.remove('is-entering');
        void ticker.offsetWidth;
        ticker.textContent = stats[tickerIndex];
        ticker.classList.add('is-entering');
      }, 1000);
    });

    card.addEventListener('click', () => {
      capsules.forEach((c) => c.classList.toggle('is-active', c === card));
      const data = gameData[index];
      if (!data) return;
      if (previewName) previewName.textContent = data.name;
      if (previewState) previewState.textContent = data.state;
      if (previewSize) previewSize.textContent = data.size;
      if (previewSync) previewSync.textContent = data.sync;
      if (previewBadge) previewBadge.textContent = data.badge;
    });

    card.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        card.click();
      }
    });

    const play = card.querySelector('.card-play');
    if (play) {
      play.addEventListener('click', (event) => {
        event.stopPropagation();
        const data = gameData[index];
        toast(data ? 'Launching ' + data.name : 'Launching game');
      });
    }
  });

  /* ---------- diff explorer ---------- */
  const fileIcon = '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/></svg>';

  const baseFiles = [
    { dir: 'Game/Binaries/', name: 'Game.exe', size: '42.6 MB' },
    { dir: 'Game/Content/', name: 'level_01.pak', size: '1.8 GB' },
    { dir: 'Game/Content/', name: 'level_02.pak', size: '2.3 GB' },
    { dir: 'Saves/', name: 'slot_01.dat', size: '128 KB' },
    { dir: 'Saves/', name: 'settings.ini', size: '4 KB' },
    { dir: 'Saves/', name: 'thumbnail.png', size: '1.2 MB' }
  ];

  const modeConfig = {
    clean: {
      title: 'Clean manifest',
      meta: '6 files tracked',
      note: 'The server hashes every clean file once at upload. This baseline never changes and is shared by every player.',
      states: {}
    },
    usera: {
      title: 'User A save overlay',
      meta: '2 chunks changed',
      note: 'Hashing in the browser compares local saves to the clean manifest. Only changed 4 MB chunks are uploaded to A’s private overlay.',
      states: { 'slot_01.dat': ['change', '2 chunks sent'], 'settings.ini': ['change', '1 chunk sent'] }
    },
    userb: {
      title: 'User B save overlay',
      meta: '1 chunk changed, 1 deleted',
      note: 'B has different progress. Their overlay is fully isolated, including a save file marked for deletion on download.',
      states: { 'slot_01.dat': ['change', '1 chunk sent'], 'thumbnail.png': ['delete', 'Marked deleted'] }
    },
    merge: {
      title: 'On-the-fly streaming zip',
      meta: 'clean + overlay − deletions',
      note: 'At download time the server streams clean files, substitutes overlay versions, and skips deletions. No cached zip is ever built.',
      states: {
        'Game.exe': ['skip', 'From clean'],
        'level_01.pak': ['skip', 'From clean'],
        'level_02.pak': ['skip', 'From clean'],
        'slot_01.dat': ['change', 'From overlay'],
        'settings.ini': ['skip', 'From clean'],
        'thumbnail.png': ['delete', 'Excluded']
      },
      extra: { name: 'merged-download.zip', size: '4.1 GB', state: 'keep', label: 'Streamed to disk' }
    }
  };

  const filetree = document.getElementById('filetree');
  const consoleTitle = document.getElementById('console-title');
  const consoleMeta = document.getElementById('console-meta');
  const consoleNote = document.getElementById('console-note');

  function renderExplorer(mode) {
    const config = modeConfig[mode];
    if (!config || !filetree) return;
    if (consoleTitle) consoleTitle.textContent = config.title;
    if (consoleMeta) consoleMeta.textContent = config.meta;
    if (consoleNote) consoleNote.textContent = config.note;

    const rows = baseFiles.map((file, i) => {
      const state = (config.states && config.states[file.name]) || ['skip', 'Unchanged'];
      return { ...file, state: state[0], label: state[1], delay: i * 40 };
    });
    if (config.extra) {
      rows.push({
        dir: '→ ',
        name: config.extra.name,
        size: config.extra.size,
        state: config.extra.state,
        label: config.extra.label,
        delay: rows.length * 40
      });
    }

    filetree.innerHTML = rows
      .map(
        (row) => `
        <div class="file-row" style="animation-delay:${row.delay}ms">
          <span class="file-icon">${fileIcon}</span>
          <span class="file-name"><span class="file-dir">${row.dir}</span>${row.name}</span>
          <span class="file-size">${row.size}</span>
          <span class="file-state state-${row.state}"><i></i>${row.label}</span>
        </div>`
      )
      .join('');
  }

  const explorerNodes = Array.from(document.querySelectorAll('.explorer-node'));
  explorerNodes.forEach((node) => {
    node.addEventListener('click', () => {
      explorerNodes.forEach((n) => {
        const active = n === node;
        n.classList.toggle('is-active', active);
        n.setAttribute('aria-selected', active ? 'true' : 'false');
      });
      renderExplorer(node.dataset.mode);
    });
    node.addEventListener('mouseenter', () => {
      if (node !== document.querySelector('.explorer-node.is-active')) {
        // hover preview without changing selection would be noisy; keep click authoritative
      }
    });
  });
  renderExplorer('clean');

  /* ---------- waveform ---------- */
  const canvas = document.getElementById('wave-canvas');
  const waveWrap = document.getElementById('wave-wrap');
  const waveRate = document.getElementById('wave-rate');
  const waveStatus = document.getElementById('wave-status');
  const waveTooltip = document.getElementById('wave-tooltip');
  const ttRate = document.getElementById('tt-rate');
  const ttTime = document.getElementById('tt-time');
  const progressBar = document.getElementById('wave-progress-bar');
  const waveBytes = document.getElementById('wave-bytes');

  const modeSettings = {
    store: { status: 'Streaming at wire speed', color: '#7dfa9b', base: 98, jitter: 15, speed: 0.22 },
    throttle: { status: 'Bandwidth cap active', color: '#6bb3ff', base: 49, jitter: 4, speed: 0.1 },
    paused: { status: 'Transfer paused', color: '#5c5c68', base: 0, jitter: 0, speed: 0 }
  };

  if (canvas && waveWrap) {
    const ctx = canvas.getContext('2d');
    const samples = new Array(120).fill(0);
    let mode = 'store';
    let cssW = 0;
    let cssH = 0;
    let dpr = 1;
    let smooth = 0;
    let phase = 0;
    let progress = 64;
    let bytes = 7.8;
    let scrubX = null;
    let lastRateText = '';

    function resizeCanvas() {
      const rect = waveWrap.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      cssW = Math.max(1, Math.floor(rect.width));
      cssH = Math.max(1, Math.floor(rect.height));
      canvas.width = Math.floor(cssW * dpr);
      canvas.height = Math.floor(cssH * dpr);
      canvas.style.width = cssW + 'px';
      canvas.style.height = cssH + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function sampleValue() {
      const cfg = modeSettings[mode];
      if (mode === 'paused') return smooth * 0.82;
      const wave = Math.sin(phase) * 7 + Math.sin(phase * 2.7) * 4;
      const noise = (Math.random() - 0.5) * cfg.jitter;
      const spike = Math.random() > 0.985 ? 16 : 0;
      const target = Math.max(0, Math.min(118, cfg.base + wave + noise + spike));
      smooth += (target - smooth) * (reduceMotion ? 1 : 0.35);
      return smooth;
    }

    function yFor(value) {
      return cssH - (Math.max(0, Math.min(120, value)) / 120) * cssH;
    }

    function draw() {
      const cfg = modeSettings[mode];
      ctx.clearRect(0, 0, cssW, cssH);

      // grid
      ctx.save();
      ctx.strokeStyle = 'rgba(255,255,255,0.045)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 6]);
      for (let i = 1; i < 4; i++) {
        const y = (cssH / 4) * i;
        ctx.beginPath();
        ctx.moveTo(0, y + 0.5);
        ctx.lineTo(cssW, y + 0.5);
        ctx.stroke();
      }
      for (let i = 1; i < 8; i++) {
        const x = (cssW / 8) * i;
        ctx.beginPath();
        ctx.moveTo(x + 0.5, 0);
        ctx.lineTo(x + 0.5, cssH);
        ctx.stroke();
      }
      ctx.restore();

      const n = samples.length;
      const step = cssW / (n - 1);

      // filled area
      const gradient = ctx.createLinearGradient(0, 0, 0, cssH);
      if (mode === 'paused') {
        gradient.addColorStop(0, 'rgba(92,92,104,0.16)');
        gradient.addColorStop(1, 'rgba(92,92,104,0)');
      } else if (mode === 'throttle') {
        gradient.addColorStop(0, 'rgba(107,179,255,0.28)');
        gradient.addColorStop(1, 'rgba(107,179,255,0)');
      } else {
        gradient.addColorStop(0, 'rgba(125,250,155,0.32)');
        gradient.addColorStop(1, 'rgba(125,250,155,0)');
      }
      ctx.beginPath();
      ctx.moveTo(0, cssH);
      for (let i = 0; i < n; i++) ctx.lineTo(i * step, yFor(samples[i]));
      ctx.lineTo(cssW, cssH);
      ctx.closePath();
      ctx.fillStyle = gradient;
      ctx.fill();

      // curve
      ctx.save();
      ctx.beginPath();
      for (let i = 0; i < n; i++) {
        const x = i * step;
        const y = yFor(samples[i]);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = cfg.color;
      ctx.lineWidth = 2;
      ctx.lineJoin = 'round';
      ctx.shadowColor = cfg.color;
      ctx.shadowBlur = mode === 'paused' ? 0 : 12;
      ctx.stroke();
      ctx.restore();

      // head dot
      const headY = yFor(samples[n - 1]);
      ctx.beginPath();
      ctx.arc(cssW - step, headY, 3.2, 0, Math.PI * 2);
      ctx.fillStyle = cfg.color;
      ctx.shadowColor = cfg.color;
      ctx.shadowBlur = 14;
      ctx.fill();
      ctx.shadowBlur = 0;

      // scrub guide
      if (scrubX !== null) {
        const idx = Math.max(0, Math.min(n - 1, Math.round(scrubX / step)));
        ctx.save();
        ctx.strokeStyle = 'rgba(255,255,255,0.35)';
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(idx * step + 0.5, 0);
        ctx.lineTo(idx * step + 0.5, cssH);
        ctx.stroke();
        ctx.restore();
        ctx.beginPath();
        ctx.arc(idx * step, yFor(samples[idx]), 4, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        if (ttRate && ttTime) {
          ttRate.textContent = samples[idx].toFixed(1) + ' MB/s';
          ttTime.textContent = idx === n - 1 ? 'now' : ((n - 1 - idx) / 30).toFixed(1) + ' s ago';
        }
      }
    }

    let lastPush = 0;
    function frame(now) {
      if (now - lastPush > 33) {
        samples.push(sampleValue());
        samples.shift();
        phase += 0.06;
        lastPush = now;
        if (mode !== 'paused') {
          progress = Math.min(99.5, progress + (mode === 'store' ? 0.035 : 0.016));
          bytes = Math.min(12.2, 7.8 + (progress - 64) * 0.129);
          if (progressBar) progressBar.style.width = progress.toFixed(1) + '%';
          if (waveBytes) waveBytes.textContent = bytes.toFixed(1) + ' / 12.2 GB';
        }
      }
      const rate = samples[samples.length - 1];
      const rateText = rate.toFixed(1) + ' MB/s';
      if (waveRate && rateText !== lastRateText) {
        waveRate.textContent = rateText;
        lastRateText = rateText;
      }
      draw();
      window.requestAnimationFrame(frame);
    }

    if ('ResizeObserver' in window) {
      new ResizeObserver(resizeCanvas).observe(waveWrap);
    } else {
      window.addEventListener('resize', resizeCanvas);
    }
    resizeCanvas();
    window.requestAnimationFrame(frame);

    waveWrap.addEventListener('pointermove', (event) => {
      const rect = waveWrap.getBoundingClientRect();
      scrubX = Math.min(rect.width, Math.max(0, event.clientX - rect.left));
      if (waveTooltip) {
        waveTooltip.hidden = false;
        const clamped = Math.min(rect.width - 60, Math.max(60, scrubX));
        waveTooltip.style.left = clamped + 'px';
        waveTooltip.style.top = Math.min(rect.height - 4, Math.max(48, event.clientY - rect.top)) + 'px';
      }
    });
    waveWrap.addEventListener('pointerleave', () => {
      scrubX = null;
      if (waveTooltip) waveTooltip.hidden = true;
    });

    const modeButtons = Array.from(document.querySelectorAll('.mode-btn'));
    modeButtons.forEach((button) => {
      button.addEventListener('click', () => {
        mode = button.dataset.mode;
        modeButtons.forEach((b) => b.classList.toggle('is-active', b === button));
        if (waveStatus) waveStatus.textContent = modeSettings[mode].status;
        if (waveRate) waveRate.style.color = mode === 'throttle' ? '#6bb3ff' : mode === 'paused' ? '#8f8f9a' : '#7dfa9b';
      });
    });
  }

  /* ---------- deploy tabs ---------- */
  const deployTabs = Array.from(document.querySelectorAll('.deploy-tab'));
  const deployPanels = Array.from(document.querySelectorAll('.deploy-panel'));
  deployTabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.tab;
      deployTabs.forEach((t) => {
        const active = t === tab;
        t.classList.toggle('is-active', active);
        t.setAttribute('aria-selected', active ? 'true' : 'false');
      });
      deployPanels.forEach((panel) => {
        const active = panel.dataset.panel === target;
        panel.classList.toggle('is-active', active);
        panel.hidden = !active;
      });
    });
  });

  document.querySelectorAll('.code-copy').forEach((button) => {
    button.addEventListener('click', async () => {
      const code = document.getElementById(button.dataset.copy);
      if (!code) return;
      const ok = await copyText(code.textContent.trim());
      flashCopied(button, true);
      toast(ok ? 'Command copied to clipboard' : 'Select the command to copy it');
    });
  });

  /* ---------- bento spotlight ---------- */
  document.querySelectorAll('[data-spotlight]').forEach((card) => {
    card.addEventListener('pointermove', (event) => {
      const rect = card.getBoundingClientRect();
      card.style.setProperty('--sx', (((event.clientX - rect.left) / rect.width) * 100).toFixed(1) + '%');
      card.style.setProperty('--sy', (((event.clientY - rect.top) / rect.height) * 100).toFixed(1) + '%');
    });
  });
})();
