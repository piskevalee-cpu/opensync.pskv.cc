(() => {
  'use strict';

  const reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function toast(message) {
    const host = document.getElementById('toasts');
    if (!host) return;
    const item = document.createElement('div');
    item.className = 'toast';
    item.textContent = message;
    host.appendChild(item);
    setTimeout(() => item.remove(), 2400);
  }

  // Dismiss announcement bar
  const announceClose = document.getElementById('announce-close');
  if (announceClose) {
    announceClose.addEventListener('click', () => {
      const bar = document.getElementById('announce-bar');
      if (bar) bar.hidden = true;
    });
  }

  let pulseBoost = 0;

  // Antigravity-inspired directional orbital particle field
  function initParticleCanvas(canvas, dense) {
    if (!canvas || reducedMotion) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const palette = [
      'rgba(125, 250, 155, 0.85)',
      'rgba(125, 250, 155, 0.56)',
      'rgba(74, 222, 128, 0.45)',
      'rgba(187, 247, 208, 0.34)',
    ];

    let width = 0;
    let height = 0;
    let dpr = 1;
    let particles = [];
    const pointer = { x: -9999, y: -9999, active: false };

    function rebuild() {
      const rect = canvas.parentElement.getBoundingClientRect();
      width = Math.max(320, Math.round(rect.width));
      height = Math.max(240, Math.round(rect.height));
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const count = dense ? Math.min(115, Math.round((width * height) / 11000)) : 65;
      particles = Array.from({ length: count }, (_, idx) => {
        const angle = (idx / count) * Math.PI * 2 + (idx % 7) * 0.2;
        const radiusFactor = 0.18 + ((idx * 37) % 100) / 120;
        return {
          x: (width * 0.5) + Math.cos(angle) * width * 0.44 * radiusFactor,
          y: (height * 0.48) + Math.sin(angle) * height * 0.46 * radiusFactor,
          vx: (Math.random() - 0.5) * 0.16,
          vy: (Math.random() - 0.5) * 0.16,
          len: 3 + (idx % 5) * 1.4,
          color: palette[idx % palette.length],
          phase: idx * 0.41,
        };
      });
    }

    canvas.parentElement.addEventListener('pointermove', (e) => {
      const rect = canvas.parentElement.getBoundingClientRect();
      pointer.x = e.clientX - rect.left;
      pointer.y = e.clientY - rect.top;
      pointer.active = true;
    });

    canvas.parentElement.addEventListener('pointerleave', () => {
      pointer.active = false;
    });

    let rafId = 0;
    let tick = 0;
    function frame() {
      tick += 0.015;
      if (pulseBoost > 0) pulseBoost = Math.max(0, pulseBoost - 0.02);

      ctx.clearRect(0, 0, width, height);
      const cx = width * 0.5;
      const cy = height * 0.44;

      for (const p of particles) {
        p.x += p.vx + Math.cos(tick + p.phase) * 0.12;
        p.y += p.vy + Math.sin(tick + p.phase) * 0.12;

        if (p.x < -20) p.x = width + 20;
        if (p.x > width + 20) p.x = -20;
        if (p.y < -20) p.y = height + 20;
        if (p.y > height + 20) p.y = -20;

        let dx = p.x - cx;
        let dy = p.y - cy;
        if (pointer.active) {
          dx = p.x - pointer.x;
          dy = p.y - pointer.y;
          const dist = Math.hypot(dx, dy);
          if (dist < 140 && dist > 1) {
            const push = (140 - dist) * 0.014;
            p.x += (dx / dist) * push;
            p.y += (dy / dist) * push;
          }
        }

        if (pulseBoost > 0) {
          const distCenter = Math.max(1, Math.hypot(p.x - cx, p.y - cy));
          p.x += ((p.x - cx) / distCenter) * pulseBoost * 1.4;
          p.y += ((p.y - cy) / distCenter) * pulseBoost * 1.4;
        }

        const angle = Math.atan2(dy, dx);
        const len = p.len + pulseBoost * 4;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(angle);
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 1.6;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(-len * 0.5, 0);
        ctx.lineTo(len * 0.5, 0);
        ctx.stroke();
        ctx.restore();
      }

      rafId = requestAnimationFrame(frame);
    }

    rebuild();
    window.addEventListener('resize', rebuild, { passive: true });
    rafId = requestAnimationFrame(frame);

    document.addEventListener('visibilitychange', () => {
      if (document.hidden && rafId) {
        cancelAnimationFrame(rafId);
        rafId = 0;
      } else if (!document.hidden && !rafId) {
        rafId = requestAnimationFrame(frame);
      }
    });
  }

  initParticleCanvas(document.getElementById('hero-particles'), true);
  initParticleCanvas(document.getElementById('install-particles'), false);

  // Showcase mode pills & cabinet play simulation
  const MODE_COPY = {
    sync: 'Exits trigger SHA-256 hashing against the clean manifest and upload only modified save chunks. Offline queues flush automatically on reconnect.',
    stream: 'OpenSync streams uncompressed STORE archives directly to disk with inline SHA-256 verification and zero temporary zip files.',
    recovery: 'Live sessions persist in SQLite while a game runs. After a force-quit, the next launch inspects unsynced local changes and offers one-click recovery.',
  };

  document.querySelectorAll('.mode-pills .mode-pill').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.mode-pills .mode-pill').forEach((other) => {
        const active = other === btn;
        other.classList.toggle('is-active', active);
        other.setAttribute('aria-selected', String(active));
      });
      const caption = document.getElementById('mode-caption');
      if (caption) caption.textContent = MODE_COPY[btn.dataset.mode] || MODE_COPY.sync;
    });
  });

  // Exact WebUI 3D Steam capsule tilt + acrylic sheen sweep
  document.querySelectorAll('.game-tile').forEach((tile) => {
    const MAX_TILT_X = 7;
    const MAX_TILT_Y = 8;

    tile.addEventListener('pointermove', (e) => {
      if (reducedMotion) return;
      const rect = tile.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const px = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const py = ((e.clientY - rect.top) / rect.height) * 2 - 1;
      tile.style.setProperty('--rx', `${(-py * MAX_TILT_X).toFixed(2)}deg`);
      tile.style.setProperty('--ry', `${(px * MAX_TILT_Y).toFixed(2)}deg`);
      tile.style.setProperty('--gx', `${(((e.clientX - rect.left) / rect.width) * 100).toFixed(1)}%`);
      tile.style.setProperty('--gy', `${(((e.clientY - rect.top) / rect.height) * 100).toFixed(1)}%`);
    });

    tile.addEventListener('pointerleave', () => {
      tile.style.removeProperty('--rx');
      tile.style.removeProperty('--ry');
      tile.style.removeProperty('--gx');
      tile.style.removeProperty('--gy');
    });
  });

  let playTimer = null;
  document.querySelectorAll('.tile-play').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const title = btn.dataset.game || 'Game';
      const pill = document.getElementById('cw-state-pill');
      const stateText = document.getElementById('cw-state-text');
      const footerNote = document.getElementById('cw-footer-note');
      const metric = document.getElementById('cw-metric');

      if (playTimer) clearTimeout(playTimer);
      if (pill) pill.classList.add('is-syncing');
      if (stateText) stateText.textContent = `Running ${title}`;
      if (footerNote) footerNote.textContent = `Tracking session for ${title}...`;
      if (metric) metric.textContent = 'LIVE';

      playTimer = setTimeout(() => {
        if (stateText) stateText.textContent = `Auto-syncing saves`;
        if (footerNote) footerNote.textContent = `${title} closed · uploading 2 changed save files`;
        if (metric) metric.textContent = '1.4 MB';

        playTimer = setTimeout(() => {
          if (pill) pill.classList.remove('is-syncing');
          if (stateText) stateText.textContent = 'Saves synced';
          if (footerNote) footerNote.textContent = `${title} overlay verified cleanly on server`;
          if (metric) metric.textContent = '98.4 MB/s';
        }, 1200);
      }, 950);
    });
  });

  // Fetch latest release assets from GitHub (fallback to v0.1.0 if offline/rate-limited)
  const LATEST_RELEASE_API = 'https://api.github.com/repos/piskevalee-cpu/OpenSync-Launcher/releases/latest';
  const PLAYER_TARGETS = {
    flatpak: {
      ext: '.flatpak',
      url: 'https://github.com/piskevalee-cpu/OpenSync-Launcher/releases/download/v0.1.0/OpenSync_Launcher_0.1.0_amd64.flatpak',
      cmd: (url) => `curl -fSL ${url} -o /tmp/opensync.flatpak && flatpak install --user -y /tmp/opensync.flatpak && flatpak run io.opensync.launcher`,
    },
    appimage: {
      ext: '.AppImage',
      url: 'https://github.com/piskevalee-cpu/OpenSync-Launcher/releases/download/v0.1.0/OpenSync_Launcher_0.1.0_amd64.AppImage',
      cmd: (url) => `curl -fSL ${url} -o OpenSync_Launcher.AppImage && chmod +x OpenSync_Launcher.AppImage && ./OpenSync_Launcher.AppImage`,
    },
    windows: {
      ext: '.exe',
      url: 'https://github.com/piskevalee-cpu/OpenSync-Launcher/releases/download/v0.1.0/OpenSync_Launcher_0.1.0_x64.exe',
      cmd: (url) => `irm ${url} -OutFile OpenSync_Launcher.exe; .\\OpenSync_Launcher.exe`,
    },
  };

  function syncPlayerCommand(activeKey) {
    const entry = PLAYER_TARGETS[activeKey] || PLAYER_TARGETS.flatpak;
    const codeEl = document.getElementById('cmd-player');
    if (codeEl) codeEl.textContent = entry.cmd(entry.url);
    document.querySelectorAll('.player-tabs .mode-pill').forEach((link) => {
      const target = PLAYER_TARGETS[link.dataset.player];
      if (target) link.href = target.url;
    });
  }

  let latestResolved = false;
  const resolveLatestRelease = (async () => {
    try {
      const res = await fetch(LATEST_RELEASE_API, { headers: { Accept: 'application/vnd.github+json' } });
      if (!res.ok) return;
      const release = await res.json();
      const assets = Array.isArray(release.assets) ? release.assets : [];
      for (const target of Object.values(PLAYER_TARGETS)) {
        const match = assets.find((a) => typeof a.name === 'string' && a.name.endsWith(target.ext) && !a.name.endsWith('.sha256') && a.browser_download_url);
        if (match) target.url = match.browser_download_url;
      }
      const badge = document.getElementById('launcher-release-pill');
      if (badge && release.tag_name) badge.textContent = `Desktop Launcher · ${release.tag_name}`;
      latestResolved = true;
      const active = document.querySelector('.player-tabs .mode-pill.is-active');
      syncPlayerCommand(active?.dataset.player || 'flatpak');
    } catch (_) {
      /* fallback URLs already configured */
    }
  })();

  syncPlayerCommand('flatpak');

  document.querySelectorAll('.player-tabs .mode-pill').forEach((tab) => {
    tab.addEventListener('click', async (e) => {
      e.preventDefault();
      document.querySelectorAll('.player-tabs .mode-pill').forEach((other) => {
        const active = other === tab;
        other.classList.toggle('is-active', active);
        other.setAttribute('aria-selected', String(active));
      });
      const key = tab.dataset.player || 'flatpak';
      syncPlayerCommand(key);
      if (!latestResolved) await resolveLatestRelease;
      const target = PLAYER_TARGETS[key] || PLAYER_TARGETS.flatpak;
      const a = document.createElement('a');
      a.href = target.url;
      a.download = '';
      a.rel = 'noopener';
      document.body.appendChild(a);
      a.click();
      a.remove();
    });
  });

  // Server command switcher in Install section
  const SERVER_CMDS = {
    script: 'curl -fsSL https://raw.githubusercontent.com/piskevalee-cpu/OpenSync/refs/heads/main/install.sh | bash',
    docker: 'curl -O https://raw.githubusercontent.com/piskevalee-cpu/OpenSync/refs/heads/main/docker-compose.yml && docker compose up -d',
    source: 'git clone https://github.com/piskevalee-cpu/OpenSync.git && cd OpenSync && npm install && npm run db:init && npm start',
  };

  document.querySelectorAll('.server-tabs .mode-pill').forEach((tab) => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.server-tabs .mode-pill').forEach((other) => {
        const active = other === tab;
        other.classList.toggle('is-active', active);
        other.setAttribute('aria-selected', String(active));
      });
      const codeEl = document.getElementById('cmd-server');
      if (codeEl) codeEl.textContent = SERVER_CMDS[tab.dataset.server] || SERVER_CMDS.script;
    });
  });

  // Feature cards jump cleanly or copy quick context
  document.querySelectorAll('.feature-card').forEach((card) => {
    card.addEventListener('click', () => {
      const heading = card.querySelector('h3')?.textContent || 'Feature';
      toast(`${heading} — built into OpenSync v0.1.0`);
    });
  });

  // Clipboard copy buttons
  document.querySelectorAll('.copy-pill').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const target = document.getElementById(btn.dataset.copy);
      if (!target) return;
      try {
        await navigator.clipboard.writeText(target.textContent.trim());
        btn.textContent = 'Copied';
        toast('Command copied to clipboard');
        setTimeout(() => { btn.textContent = 'Copy'; }, 1600);
      } catch (_) {
        toast('Select and copy the command manually');
      }
    });
  });
})();
