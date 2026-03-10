/* ============================================================
   THEBUILD.SHOP — Main JavaScript
   Blueprint canvas, code typing, scroll reveals, terminal CTA
   ============================================================ */

'use strict';

// =====================
// BLUEPRINT CANVAS
// =====================

const canvas = document.getElementById('blueprint-canvas');
const ctx    = canvas.getContext('2d');
let W, H;

function resizeCanvas() {
  W = canvas.width  = window.innerWidth;
  H = canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas, { passive: true });

// Grid animates in over ~1500ms (0 → 1)
let gridReveal = 0;

// Floating blueprint callouts (technical annotations on canvas)
const CALLOUT_DATA = [
  { rx: 0.10, ry: 0.22, text: '/* viewport layer */', phase: 0.0 },
  { rx: 0.70, ry: 0.14, text: 'width: 1920px',        phase: 1.8 },
  { rx: 0.06, ry: 0.66, text: 'z-index: layer 0',     phase: 3.2 },
  { rx: 0.78, ry: 0.75, text: 'grid: 64px',           phase: 1.1 },
  { rx: 0.38, ry: 0.88, text: '↓ scroll to explore',  phase: 2.5 },
  { rx: 0.56, ry: 0.38, text: 'build: running...',    phase: 0.7 },
];

let calloutClock = 0;

function updateCallouts() {
  calloutClock += 0.007;
}

function drawCallouts() {
  ctx.font = '300 10px "JetBrains Mono", monospace';
  ctx.textBaseline = 'middle';
  CALLOUT_DATA.forEach(c => {
    const wave  = Math.sin(calloutClock - c.phase);
    const alpha = Math.max(0, wave * 0.16);
    if (alpha < 0.01) return;
    const x = c.rx * W;
    const y = c.ry * H;
    ctx.fillStyle   = `rgba(0,212,255,${alpha})`;
    ctx.fillText(c.text, x + 12, y);
    // tick mark
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + 9, y);
    ctx.strokeStyle = `rgba(0,212,255,${alpha * 0.6})`;
    ctx.lineWidth   = 0.5;
    ctx.stroke();
  });
}

// Architectural corner bracket markers
function drawCornerMarkers() {
  const alpha = Math.min(1, gridReveal * 2) * 0.3;
  if (alpha < 0.01) return;
  ctx.strokeStyle = `rgba(0,212,255,${alpha})`;
  ctx.lineWidth   = 1;
  const arm = 20;
  const pad = 26;
  [
    [pad,         pad,         1,  1 ],
    [W - pad,     pad,        -1,  1 ],
    [pad,         H - pad,     1, -1 ],
    [W - pad,     H - pad,    -1, -1 ],
  ].forEach(([x, y, dx, dy]) => {
    ctx.beginPath();
    ctx.moveTo(x + dx * arm, y);
    ctx.lineTo(x, y);
    ctx.lineTo(x, y + dy * arm);
    ctx.stroke();
  });
}

// Particle system
class Particle {
  constructor() { this.init(); }
  init() {
    this.x    = Math.random() * W;
    this.y    = Math.random() * H;
    this.vx   = (Math.random() - 0.5) * 0.35;
    this.vy   = (Math.random() - 0.5) * 0.35;
    this.life = 0.3 + Math.random() * 0.5;
    this.size = 0.5 + Math.random() * 1.5;
  }
  tick() {
    this.x    += this.vx;
    this.y    += this.vy;
    this.life -= 0.002;
    if (this.life <= 0 || this.x < 0 || this.x > W || this.y < 0 || this.y > H) this.init();
  }
  draw() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(0,212,255,${this.life * 0.45})`;
    ctx.fill();
  }
}

const PARTICLE_COUNT = 70;
const particles = Array.from({ length: PARTICLE_COUNT }, () => new Particle());

function drawConnections() {
  const MAX_DIST = 120;
  for (let i = 0; i < particles.length; i++) {
    for (let j = i + 1; j < particles.length; j++) {
      const dx   = particles[i].x - particles[j].x;
      const dy   = particles[i].y - particles[j].y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < MAX_DIST) {
        const alpha = (1 - dist / MAX_DIST) * 0.07;
        ctx.beginPath();
        ctx.moveTo(particles[i].x, particles[i].y);
        ctx.lineTo(particles[j].x, particles[j].y);
        ctx.strokeStyle = `rgba(0,212,255,${alpha})`;
        ctx.lineWidth   = 0.5;
        ctx.stroke();
      }
    }
  }
}

// Grid draws in progressively — vertical lines first, then horizontal
function drawGrid() {
  const progress = Math.min(1, gridReveal);
  if (progress <= 0) return;

  const SIZE = 64;
  ctx.lineWidth   = 0.5;
  ctx.strokeStyle = 'rgba(0,212,255,0.055)';

  const cols       = Math.ceil(W / SIZE) + 1;
  const rows       = Math.ceil(H / SIZE) + 1;
  const totalLines = cols + rows;
  const revealCount = Math.floor(totalLines * progress);

  let drawn = 0;

  // Vertical lines draw down from top
  for (let x = 0; x <= W; x += SIZE) {
    if (drawn >= revealCount) break;
    const p = Math.min(1, revealCount - drawn);
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, H * p);
    ctx.stroke();
    drawn++;
  }

  // Horizontal lines draw right from left
  for (let y = 0; y <= H; y += SIZE) {
    if (drawn >= revealCount) break;
    const p = Math.min(1, revealCount - drawn);
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W * p, y);
    ctx.stroke();
    drawn++;
  }

  // Accent intersections fade in at end of reveal
  if (progress > 0.75) {
    const iAlpha = ((progress - 0.75) / 0.25) * 0.18;
    ctx.fillStyle = `rgba(0,212,255,${iAlpha})`;
    for (let x = 0; x <= W; x += SIZE * 4) {
      for (let y = 0; y <= H; y += SIZE * 4) {
        ctx.beginPath(); ctx.arc(x, y, 1.5, 0, Math.PI * 2); ctx.fill();
        ctx.fillRect(x - 4, y, 8, 0.5);
        ctx.fillRect(x, y - 4, 0.5, 8);
      }
    }
  }
}

let lastFrameTime = 0;
function animateCanvas(ts = 0) {
  const dt = Math.min(ts - lastFrameTime, 50); // cap delta at 50ms
  lastFrameTime = ts;

  ctx.clearRect(0, 0, W, H);

  // Advance grid reveal over ~1500ms
  if (gridReveal < 1) gridReveal = Math.min(1, gridReveal + dt / 1500);

  drawGrid();
  drawCornerMarkers();
  drawConnections();
  particles.forEach(p => { p.tick(); p.draw(); });

  if (gridReveal >= 0.8) {
    updateCallouts();
    drawCallouts();
  }

  requestAnimationFrame(animateCanvas);
}
requestAnimationFrame(animateCanvas);


// =====================
// CODE TYPING ENGINE
// =====================

const CODE_SEQUENCE = [
  {
    raw:  '<!-- building thebuild.shop -->',
    html: '<span class="t-comment">&lt;!-- building thebuild.shop --&gt;</span>',
    preview: null, pause: 0,
  },
  { raw: '', html: '', preview: null, pause: 120 },
  {
    raw:  '<!DOCTYPE html>',
    html: '<span class="t-tag">&lt;!DOCTYPE</span> <span class="t-attr">html</span><span class="t-tag">&gt;</span>',
    preview: null, pause: 80,
  },
  {
    raw:  '<html lang="en">',
    html: '<span class="t-tag">&lt;html</span> <span class="t-attr">lang</span>=<span class="t-string">"en"</span><span class="t-tag">&gt;</span>',
    preview: null, pause: 120,
  },
  { raw: '', html: '', preview: null, pause: 60 },
  {
    raw:  '<nav class="navbar">',
    html: '<span class="t-tag">&lt;nav</span> <span class="t-attr">class</span>=<span class="t-string">"navbar"</span><span class="t-tag">&gt;</span>',
    preview: 'nav', pause: 200,
  },
  {
    raw:  '  <a href="/">thebuild</a>',
    html: '  <span class="t-tag">&lt;a</span> <span class="t-attr">href</span>=<span class="t-string">"/"</span><span class="t-tag">&gt;</span><span class="t-val">thebuild</span><span class="t-tag">&lt;/a&gt;</span>',
    preview: null, pause: 180,
  },
  {
    raw:  '</nav>',
    html: '<span class="t-tag">&lt;/nav&gt;</span>',
    preview: null, pause: 150,
  },
  { raw: '', html: '', preview: null, pause: 60 },
  {
    raw:  '<section class="hero">',
    html: '<span class="t-tag">&lt;section</span> <span class="t-attr">class</span>=<span class="t-string">"hero"</span><span class="t-tag">&gt;</span>',
    preview: 'status-rendering', pause: 200,
  },
  {
    raw:  '  <h1>We build what',
    html: '  <span class="t-tag">&lt;h1&gt;</span><span class="t-val">We build what</span>',
    preview: null, pause: 160,
  },
  {
    raw:  '    others dream.</h1>',
    html: '    <span class="t-val">others dream.</span><span class="t-tag">&lt;/h1&gt;</span>',
    preview: 'hero', pause: 220,
  },
  {
    raw:  '  <p>Built with precision.</p>',
    html: '  <span class="t-tag">&lt;p&gt;</span><span class="t-val">Built with precision.</span><span class="t-tag">&lt;/p&gt;</span>',
    preview: null, pause: 160,
  },
  {
    raw:  '  <button class="cta">',
    html: '  <span class="t-tag">&lt;button</span> <span class="t-attr">class</span>=<span class="t-string">"cta"</span><span class="t-tag">&gt;</span>',
    preview: 'status-styling', pause: 120,
  },
  {
    raw:  '    Start Building',
    html: '    <span class="t-val">Start Building</span>',
    preview: null, pause: 100,
  },
  {
    raw:  '  </button>',
    html: '  <span class="t-tag">&lt;/button&gt;</span>',
    preview: 'button', pause: 150,
  },
  {
    raw:  '</section>',
    html: '<span class="t-tag">&lt;/section&gt;</span>',
    preview: null, pause: 180,
  },
  { raw: '', html: '', preview: null, pause: 60 },
  {
    raw:  '<footer>',
    html: '<span class="t-tag">&lt;footer&gt;</span>',
    preview: null, pause: 100,
  },
  {
    raw:  '  <p>© 2026 thebuild.shop</p>',
    html: '  <span class="t-tag">&lt;p&gt;</span><span class="t-val">© 2026 thebuild.shop</span><span class="t-tag">&lt;/p&gt;</span>',
    preview: 'features', pause: 120,
  },
  {
    raw:  '</footer>',
    html: '<span class="t-tag">&lt;/footer&gt;</span>',
    preview: 'done', pause: 0,
  },
];

const typedCode   = document.getElementById('typed-code');
const lineNumbers = document.getElementById('line-numbers');
const previewBody = document.getElementById('preview-body');
const buildStatus = document.getElementById('build-status');
const codeScroll  = typedCode.closest('.code-scroll');

let cursorEl = null;

function addCursor() {
  removeCursor();
  cursorEl = document.createElement('span');
  cursorEl.className = 'code-cursor';
  typedCode.appendChild(cursorEl);
}
function removeCursor() {
  if (cursorEl && cursorEl.parentNode) cursorEl.parentNode.removeChild(cursorEl);
  cursorEl = null;
}

let lineCount = 0;
function addLineNumber() {
  lineCount++;
  const span = document.createElement('span');
  span.style.display = 'block';
  span.textContent   = String(lineCount).padStart(2, ' ');
  lineNumbers.appendChild(span);
}

// Preview builders — construct UI in the preview panel as code types
const previewBuilders = {
  'status-rendering': () => {
    buildStatus.textContent = '● Rendering...';
  },
  'status-styling': () => {
    buildStatus.textContent = '● Applying styles...';
  },
  nav: () => {
    const nav = document.createElement('div');
    nav.className = 'preview-nav';
    nav.innerHTML = `
      <span class="preview-nav-logo">{ tb }</span>
      <div class="preview-nav-items">
        <div class="preview-nav-item"></div>
        <div class="preview-nav-item"></div>
        <div class="preview-nav-item"></div>
      </div>
    `;
    previewBody.appendChild(nav);
    requestAnimationFrame(() => { setTimeout(() => nav.classList.add('show'), 30); });
  },
  hero: () => {
    const block = document.createElement('div');
    block.className = 'preview-hero-block';
    block.innerHTML = `
      <div class="preview-title">We build what<br>others dream.</div>
      <div class="preview-sub">Built with precision.</div>
    `;
    previewBody.appendChild(block);
    requestAnimationFrame(() => { setTimeout(() => block.classList.add('show'), 30); });
  },
  button: () => {
    const lastBlock = previewBody.querySelector('.preview-hero-block');
    if (lastBlock && !lastBlock.querySelector('.preview-btn')) {
      const btn = document.createElement('span');
      btn.className   = 'preview-btn';
      btn.textContent = 'Start Building';
      lastBlock.appendChild(btn);
      requestAnimationFrame(() => { setTimeout(() => btn.classList.add('show'), 30); });
    }
  },
  features: () => {
    const row = document.createElement('div');
    row.className = 'preview-features-row';
    row.innerHTML = `
      <div class="preview-feat">
        <div class="preview-feat-icon">⬡</div>
        <div class="preview-feat-bar w70"></div>
        <div class="preview-feat-bar w50"></div>
      </div>
      <div class="preview-feat">
        <div class="preview-feat-icon">◈</div>
        <div class="preview-feat-bar w85"></div>
        <div class="preview-feat-bar w70"></div>
      </div>
      <div class="preview-feat">
        <div class="preview-feat-icon">⬟</div>
        <div class="preview-feat-bar w50"></div>
        <div class="preview-feat-bar w85"></div>
      </div>
    `;
    previewBody.appendChild(row);
    requestAnimationFrame(() => { setTimeout(() => row.classList.add('show'), 30); });
  },
  done: () => {
    buildStatus.textContent = '● Build complete';
    buildStatus.classList.add('done');
    spawnBurst(canvas.width * 0.75, canvas.height * 0.4);
  },
};

// Burst particles at a canvas position
function spawnBurst(bx, by, count = 14) {
  for (let i = 0; i < count; i++) {
    const p = new Particle();
    p.x    = bx + (Math.random() - 0.5) * 40;
    p.y    = by + (Math.random() - 0.5) * 40;
    p.vx   = (Math.random() - 0.5) * 2.5;
    p.vy   = (Math.random() - 0.5) * 2.5;
    p.life = 0.7;
    p.size = 1.5 + Math.random() * 2;
    particles.push(p);
  }
  setTimeout(() => { particles.splice(PARTICLE_COUNT, 9999); }, 2000);
}

// Smaller burst for card reveals
function spawnCardBurst(bx, by) {
  for (let i = 0; i < 8; i++) {
    const p = new Particle();
    p.x    = bx + (Math.random() - 0.5) * 20;
    p.y    = by + (Math.random() - 0.5) * 20;
    p.vx   = (Math.random() - 0.5) * 1.2;
    p.vy   = -0.4 - Math.random() * 1.0;
    p.life = 0.5;
    p.size = 0.8 + Math.random() * 1.5;
    particles.push(p);
  }
  setTimeout(() => { particles.splice(PARTICLE_COUNT, 9999); }, 1500);
}

// Type a single line of code, char by char, then swap to syntax-highlighted HTML
function typeLine(lineData, charDelay = 26) {
  return new Promise(resolve => {
    addLineNumber();
    const lineEl = document.createElement('span');
    lineEl.style.display = 'block';

    if (!lineData.raw) {
      typedCode.insertBefore(lineEl, cursorEl);
      lineEl.innerHTML = '\u00A0';
      addCursor();
      return resolve();
    }

    typedCode.insertBefore(lineEl, cursorEl);
    const chars = Array.from(lineData.raw);
    let i = 0;

    const tick = () => {
      if (i < chars.length) {
        i++;
        lineEl.textContent = lineData.raw.slice(0, i);
        codeScroll.scrollTop = codeScroll.scrollHeight;
        addCursor();
        setTimeout(tick, charDelay + (Math.random() - 0.5) * 12);
      } else {
        lineEl.innerHTML = lineData.html;
        addCursor();
        resolve();
      }
    };
    tick();
  });
}

async function runTypingSequence() {
  addCursor();
  for (const line of CODE_SEQUENCE) {
    await typeLine(line, line.raw.length > 10 ? 22 : 28);
    if (line.preview && previewBuilders[line.preview]) {
      previewBuilders[line.preview]();
    }
    await sleep(line.pause || 80);
  }
  removeCursor();
}


// =====================
// STATS COUNTER ANIMATION
// =====================

function animateCounter(el, target, suffix, duration = 1100) {
  const start = performance.now();
  const step = (now) => {
    const elapsed  = now - start;
    const progress = Math.min(1, elapsed / duration);
    // Ease out cubic
    const eased   = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.round(eased * target) + suffix;
    if (progress < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

function initStatsCounters() {
  document.querySelectorAll('.stat-num').forEach(el => {
    const text = el.textContent.trim();
    if (text === '48h') {
      el.textContent = '0h';
      setTimeout(() => animateCounter(el, 48, 'h', 900), 200);
    } else if (text === '100') {
      el.textContent = '0';
      setTimeout(() => animateCounter(el, 100, '', 1100), 400);
    }
    // ∞ stays as-is
  });
}


// =====================
// HERO INIT SEQUENCE
// =====================

let heroStarted = false;
function startHero() {
  if (heroStarted) return;
  heroStarted = true;

  setTimeout(() => {
    document.getElementById('code-panel').classList.add('visible');
  }, 200);

  setTimeout(() => {
    document.getElementById('preview-panel').classList.add('visible');
  }, 440);

  setTimeout(() => {
    runTypingSequence();
  }, 700);

  setTimeout(() => {
    document.getElementById('hero-headline').classList.add('visible');
    initStatsCounters();
  }, 1400);

  const scrollHint = document.getElementById('scroll-hint');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 80) scrollHint.style.opacity = '0';
  }, { passive: true, once: true });
}

window.addEventListener('load', startHero);


// =====================
// SCROLL REVEAL ENGINE
// =====================

// Base observer — adds 'visible' + respects data-delay
function makeObserver(threshold = 0.12) {
  return new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el    = entry.target;
      const delay = parseInt(el.dataset.delay || '0', 10);
      setTimeout(() => el.classList.add('visible'), delay);
      baseObs.unobserve(el);
    });
  }, { threshold });
}
const baseObs = makeObserver(0.12);

// Feature cards — reveal + particle burst at card position
document.querySelectorAll('.feature-card').forEach(el => {
  const cardObs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const delay = parseInt(entry.target.dataset.delay || '0', 10);
      setTimeout(() => {
        entry.target.classList.add('visible');
        const rect = entry.target.getBoundingClientRect();
        spawnCardBurst(rect.left + rect.width * 0.5, rect.top + rect.height * 0.3);
      }, delay);
      cardObs.unobserve(entry.target);
    });
  }, { threshold: 0.2 });
  cardObs.observe(el);
});

// Process section — steps reveal + connectors draw in
const processSteps      = document.querySelectorAll('.process-step');
const processConnectors = document.querySelectorAll('.process-connector');

// Collapse connectors immediately so they can animate in
processConnectors.forEach(c => { c.style.height = '0px'; });

const stepObs = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    const el        = entry.target;
    const stepIndex = Array.from(processSteps).indexOf(el);
    const delay     = stepIndex * 150;

    setTimeout(() => {
      el.classList.add('visible');

      // Animate the connector that follows this step
      const connector = processConnectors[stepIndex];
      if (connector) {
        setTimeout(() => {
          connector.style.transition = 'height 0.55s cubic-bezier(0.4,0,0.2,1)';
          connector.style.height     = '60px';
        }, 200);
      }
    }, delay);

    stepObs.unobserve(el);
  });
}, { threshold: 0.2 });
processSteps.forEach(el => stepObs.observe(el));

// Stack badges — staggered
document.querySelectorAll('.stack-badge').forEach((el, i) => {
  el.dataset.delay = String(i * 75);
  baseObs.observe(el);
});

// CTA copy block
const ctaCopy = document.getElementById('cta-copy');
if (ctaCopy) baseObs.observe(ctaCopy);

// Section headers — fade up
document.querySelectorAll('.section-header').forEach(el => {
  el.style.opacity    = '0';
  el.style.transform  = 'translateY(20px)';
  el.style.transition = 'opacity 0.7s ease, transform 0.7s ease';
  const hObs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.style.opacity   = '1';
      entry.target.style.transform = 'translateY(0)';
      hObs.unobserve(entry.target);
    });
  }, { threshold: 0.2 });
  hObs.observe(el);
});


// =====================
// FEATURE SNIPPET TYPING
// =====================

const FEATURE_CODE = {
  speed:  `perf.score = 100;\nttfb   < 50ms;\nfcp    < 1.2s;`,
  design: `.pixel {\n  precision: 1px;\n  fidelity:  100%;\n}`,
  scale:  `arch.pattern =\n  "microservices";\ninfra = "cloud";`,
};

function typeFeatureSnippet(el, text, speed = 28) {
  let i = 0;
  el.textContent = '';
  const tick = () => {
    if (i < text.length) {
      el.textContent += text[i++];
      setTimeout(tick, speed + (Math.random() - 0.5) * 10);
    }
  };
  tick();
}

const snippetObs = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    const el  = entry.target;
    const key = el.dataset.code;
    if (FEATURE_CODE[key]) typeFeatureSnippet(el, FEATURE_CODE[key], 24);
    snippetObs.unobserve(el);
  });
}, { threshold: 0.5 });

document.querySelectorAll('.feature-snippet').forEach(el => snippetObs.observe(el));


// =====================
// TERMINAL CTA
// =====================

const emailInput     = document.getElementById('email-input');
const terminalSubmit = document.getElementById('terminal-submit');
const terminalOutput = document.getElementById('terminal-output');

// Lines to type in when terminal scrolls into view
const BOOT_LINES = [
  { html: '<span class="t-green">✓</span> Environment ready',           delay: 0   },
  { html: '<span class="t-green">✓</span> Dependencies resolved',       delay: 350 },
  { html: '<span class="t-cyan">▶</span> Ready to start your project',  delay: 800 },
];

function addLogLine(html, delayMs = 0) {
  return new Promise(resolve => {
    setTimeout(() => {
      const p = document.createElement('p');
      p.className = 't-log-line';
      p.innerHTML = html;
      terminalOutput.appendChild(p);
      requestAnimationFrame(() => {
        setTimeout(() => { p.classList.add('show'); resolve(); }, 20);
      });
      terminalOutput.scrollTop = terminalOutput.scrollHeight;
    }, delayMs);
  });
}

function bootTerminal() {
  terminalOutput.innerHTML = '';
  BOOT_LINES.forEach(line => {
    setTimeout(() => addLogLine(line.html), line.delay);
  });
}

// Observe CTA terminal — reveal + type in boot lines on scroll
const ctaTerminal = document.getElementById('cta-terminal');
if (ctaTerminal) {
  let terminalBooted = false;
  const termObs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting || terminalBooted) return;
      terminalBooted = true;
      ctaTerminal.classList.add('visible');
      setTimeout(bootTerminal, 300);
      termObs.unobserve(entry.target);
    });
  }, { threshold: 0.3 });
  termObs.observe(ctaTerminal);
}

function isValidEmail(v) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
}

async function handleSubmit() {
  const email = emailInput.value.trim();
  if (!email) {
    await addLogLine('<span style="color:var(--red)">✗</span> email address required');
    emailInput.focus();
    return;
  }
  if (!isValidEmail(email)) {
    await addLogLine(`<span style="color:var(--red)">✗</span> invalid format: ${escapeHtml(email)}`);
    emailInput.focus();
    return;
  }

  terminalSubmit.disabled    = true;
  emailInput.disabled        = true;
  terminalSubmit.textContent = '...';

  await addLogLine(`<span class="t-cyan">▶</span> connecting ${escapeHtml(email)}...`);
  await sleep(500);
  await addLogLine('<span class="t-green">✓</span> project scope initialized');
  await sleep(700);
  await addLogLine('<span class="t-green">✓</span> build request queued');
  await sleep(500);
  await addLogLine('<span class="t-green">✓</span> we\'ll be in touch. build incoming.');

  terminalSubmit.textContent      = 'sent ✓';
  terminalSubmit.style.background = 'var(--green)';
  terminalSubmit.style.color      = '#000';
}

terminalSubmit.addEventListener('click', handleSubmit);
emailInput.addEventListener('keydown', e => { if (e.key === 'Enter') handleSubmit(); });


// =====================
// MICRO-INTERACTIONS
// =====================

// Inject ripple keyframe once
const rippleStyle = document.createElement('style');
rippleStyle.textContent = `
  @keyframes ripple-expand {
    to { transform: scale(1); opacity: 0; }
  }
`;
document.head.appendChild(rippleStyle);

function createRipple(e) {
  const btn  = e.currentTarget;
  const rect = btn.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height) * 2.2;
  const x    = e.clientX - rect.left - size / 2;
  const y    = e.clientY - rect.top  - size / 2;

  const ripple = document.createElement('span');
  ripple.style.cssText = `
    position: absolute;
    width: ${size}px;
    height: ${size}px;
    left: ${x}px;
    top: ${y}px;
    background: rgba(255,255,255,0.22);
    border-radius: 50%;
    pointer-events: none;
    transform: scale(0);
    animation: ripple-expand 0.65s ease-out forwards;
  `;
  btn.appendChild(ripple);
  setTimeout(() => ripple.remove(), 750);
}

// Apply ripple — ensure overflow:hidden and position:relative on targets
['.btn-primary', '.nav-cta', '.terminal-submit'].forEach(sel => {
  document.querySelectorAll(sel).forEach(btn => {
    btn.style.overflow = 'hidden';
    if (getComputedStyle(btn).position === 'static') btn.style.position = 'relative';
    btn.addEventListener('click', createRipple);
  });
});

// Stack badge hover — subtle particle drift
document.querySelectorAll('.stack-badge').forEach(badge => {
  badge.addEventListener('mouseenter', () => {
    const rect = badge.getBoundingClientRect();
    const bx   = rect.left + rect.width / 2;
    const by   = rect.top  + rect.height / 2;
    for (let i = 0; i < 4; i++) {
      const p = new Particle();
      p.x    = bx + (Math.random() - 0.5) * 30;
      p.y    = by + (Math.random() - 0.5) * 10;
      p.vx   = (Math.random() - 0.5) * 0.8;
      p.vy   = -0.3 - Math.random() * 0.5;
      p.life = 0.4;
      p.size = 1 + Math.random();
      particles.push(p);
    }
    setTimeout(() => { particles.splice(PARTICLE_COUNT, 9999); }, 1000);
  });
});


// =====================
// NAV: SCROLL EFFECT
// =====================

const nav = document.querySelector('.nav');
window.addEventListener('scroll', () => {
  nav.style.background = window.scrollY > 60
    ? 'rgba(8,8,15,0.96)'
    : 'rgba(8,8,15,0.75)';
}, { passive: true });


// =====================
// SMOOTH SCROLL
// =====================

document.querySelector('.nav-cta').addEventListener('click', () => {
  document.getElementById('contact').scrollIntoView({ behavior: 'smooth' });
});
document.getElementById('cta-primary').addEventListener('click', () => {
  document.getElementById('contact').scrollIntoView({ behavior: 'smooth' });
});
document.getElementById('cta-ghost').addEventListener('click', () => {
  document.getElementById('features').scrollIntoView({ behavior: 'smooth' });
});


// =====================
// UTILITIES
// =====================

function sleep(ms) {
  return new Promise(res => setTimeout(res, ms));
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
