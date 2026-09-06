(() => {
  'use strict';

  const html = document.documentElement;
  const body = document.body;
  const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointerQuery = window.matchMedia('(pointer: fine)');
  const mobileQuery = window.matchMedia('(max-width: 860px)');

  function applyMotionPref() {
    if (reducedMotionQuery.matches) body.classList.add('reduced-motion');
    else body.classList.remove('reduced-motion');
  }
  function applyPointerPref() {
    if (finePointerQuery.matches) html.classList.add('has-fine-pointer');
    else html.classList.remove('has-fine-pointer');
  }
  applyMotionPref();
  applyPointerPref();
  reducedMotionQuery.addEventListener('change', applyMotionPref);
  finePointerQuery.addEventListener('change', applyPointerPref);

  /* ------------------------------------------------------------------ */
  /* Word splitting for headline reveals                                 */
  /* ------------------------------------------------------------------ */
  document.querySelectorAll('[data-split]').forEach((el) => {
    const text = el.textContent.trim();
    const words = text.split(/\s+/);
    el.innerHTML = words.map((w, i) => `<span class="word" style="--i:${i}">${w}</span>`).join(' ');
  });

  /* ------------------------------------------------------------------ */
  /* Loader                                                              */
  /* ------------------------------------------------------------------ */
  const minLoad = new Promise((res) => setTimeout(res, 1400));
  const pageLoad = new Promise((res) => {
    if (document.readyState === 'complete') res();
    else window.addEventListener('load', res, { once: true });
  });
  Promise.all([minLoad, pageLoad]).then(() => {
    body.classList.add('is-loaded');
    const hero = document.querySelector('.hero');
    if (hero) {
      hero.querySelectorAll('[data-reveal]').forEach((el) => el.classList.add('is-in'));
    }
  });

  /* ------------------------------------------------------------------ */
  /* Custom cursor                                                       */
  /* ------------------------------------------------------------------ */
  const cursorDot = document.getElementById('cursorDot');
  const cursorLabel = document.getElementById('cursorLabel');
  let cx = window.innerWidth / 2, cy = window.innerHeight / 2;
  let lx = cx, ly = cy;

  window.addEventListener('mousemove', (e) => {
    cx = e.clientX; cy = e.clientY;
  }, { passive: true });

  function cursorLoop() {
    lx += (cx - lx) * 0.18;
    ly += (cy - ly) * 0.18;
    if (cursorDot) cursorDot.style.transform = `translate(${cx}px, ${cy}px) translate(-50%,-50%)`;
    if (cursorLabel) cursorLabel.style.transform = `translate(${lx}px, ${ly}px) translate(-50%,-50%)`;
    requestAnimationFrame(cursorLoop);
  }
  requestAnimationFrame(cursorLoop);

  const cursorMap = { explore: 'EXPLORE', open: 'OPEN', menu: 'MENU' };
  document.querySelectorAll('[data-cursor]').forEach((el) => {
    el.addEventListener('mouseenter', () => {
      const key = el.getAttribute('data-cursor');
      if (cursorLabel && cursorMap[key]) {
        cursorLabel.textContent = cursorMap[key];
        cursorLabel.classList.add('is-active');
      }
      if (cursorDot) cursorDot.classList.add('is-hidden');
    });
    el.addEventListener('mouseleave', () => {
      if (cursorLabel) cursorLabel.classList.remove('is-active');
      if (cursorDot) cursorDot.classList.remove('is-hidden');
    });
  });

  /* ------------------------------------------------------------------ */
  /* Nav compact on scroll                                               */
  /* ------------------------------------------------------------------ */
  const siteNav = document.getElementById('siteNav');
  function onNavScroll() {
    if (window.scrollY > 40) siteNav.classList.add('nav-compact');
    else siteNav.classList.remove('nav-compact');
  }
  window.addEventListener('scroll', onNavScroll, { passive: true });
  onNavScroll();

  /* ------------------------------------------------------------------ */
  /* Generic reveal on view                                              */
  /* ------------------------------------------------------------------ */
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-in');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.2 });

  document.querySelectorAll('[data-reveal], .word-reveal, [data-reveal-media]').forEach((el) => {
    revealObserver.observe(el);
  });
  document.querySelectorAll('.ritual-media[data-reveal-media]').forEach((el) => {
    revealObserver.observe(el);
    el.classList.add('ritual-media');
  });

  /* ------------------------------------------------------------------ */
  /* Scroll progress rail (01-09 across main scenes)                     */
  /* Computed directly from scroll position (robust against instant      */
  /* jumps and very tall sticky sections) rather than IO enter/exit.     */
  /* ------------------------------------------------------------------ */
  const marks = Array.from(document.querySelectorAll('[data-progress-mark]'));
  const railSpans = Array.from(document.querySelectorAll('#progressRail span'));
  function updateRail() {
    if (!marks.length || !railSpans.length) return;
    const probeY = window.innerHeight * 0.4;
    let activeIdx = 0;
    for (let i = 0; i < marks.length; i++) {
      if (marks[i].getBoundingClientRect().top <= probeY) activeIdx = i;
    }
    activeIdx = Math.min(activeIdx, railSpans.length - 1);
    railSpans.forEach((s, i) => s.classList.toggle('is-active', i === activeIdx));
  }

  /* ------------------------------------------------------------------ */
  /* CRAFT — video grow-to-fullscreen on scroll                          */
  /* ------------------------------------------------------------------ */
  const craftWrap = document.getElementById('craftWrap');
  const craftFrame = document.getElementById('craftFrame');
  const craftVideo = document.getElementById('craftVideo');
  const craftCaption = document.getElementById('craftCaption');
  const craftHint = document.getElementById('craftHint');

  let craftPlaying = false;
  function clamp01(v) { return Math.max(0, Math.min(1, v)); }

  function updateCraft() {
    if (!craftWrap) return;
    const rect = craftWrap.getBoundingClientRect();
    const total = rect.height - window.innerHeight;
    const scrolled = clamp01(-rect.top / (total || 1));

    // grow phase: 0 -> 0.55 goes from small to fullscreen; 0.55 -> 0.75 holds fullscreen; 0.75 -> 1 shrinks back
    let growT;
    let holding = false;
    if (scrolled < 0.5) {
      growT = clamp01(scrolled / 0.5);
    } else if (scrolled < 0.75) {
      growT = 1;
      holding = true;
    } else {
      growT = clamp01(1 - (scrolled - 0.75) / 0.25);
    }
    const ease = growT * growT * (3 - 2 * growT); // smoothstep

    const wStart = 34, wEnd = 100;
    const hStart = 46, hEnd = 100;
    const rStart = 6, rEnd = 0;

    craftFrame.style.setProperty('--craft-w', `${wStart + (wEnd - wStart) * ease}vw`);
    craftFrame.style.setProperty('--craft-h', `${hStart + (hEnd - hStart) * ease}svh`);
    craftFrame.style.setProperty('--craft-r', `${rStart + (rEnd - rStart) * ease}px`);
    craftFrame.style.setProperty('--craft-scale', `${1 + 0.06 * ease}`);
    craftCaption.style.setProperty('--craft-caption-o', holding ? 1 : 0);
    craftHint.style.setProperty('--craft-caption-o', (!holding && growT < 0.6) ? 1 : 0);

    const inView = rect.bottom > 0 && rect.top < window.innerHeight;
    if (inView && !craftPlaying) {
      craftVideo.play().catch(() => {});
      craftPlaying = true;
    } else if (!inView && craftPlaying) {
      craftVideo.pause();
      craftPlaying = false;
    }
  }

  /* ------------------------------------------------------------------ */
  /* HORIZONTAL PROCESS scroll (desktop only)                            */
  /* ------------------------------------------------------------------ */
  const processWrap = document.getElementById('processWrap');
  const processTrack = document.getElementById('processTrack');
  const processDots = processWrap ? Array.from(processWrap.querySelectorAll('.process-progress span')) : [];
  const processPanelCount = processWrap ? processWrap.querySelectorAll('.process-panel').length : 0;

  function updateProcess() {
    if (!processWrap || !processTrack || mobileQuery.matches) return;
    const rect = processWrap.getBoundingClientRect();
    const total = rect.height - window.innerHeight;
    const t = clamp01(-rect.top / (total || 1));
    const maxTranslate = (processPanelCount - 1) * window.innerWidth;
    processTrack.style.transform = `translateX(${-t * maxTranslate}px)`;
    const activeIdx = Math.min(processPanelCount - 1, Math.floor(t * processPanelCount));
    processDots.forEach((d, i) => d.classList.toggle('is-active', i === activeIdx));
  }

  /* ------------------------------------------------------------------ */
  /* AFTER DARK — mouse glow                                             */
  /* ------------------------------------------------------------------ */
  const afterDark = document.getElementById('afterDark');
  const afterDarkGlow = document.getElementById('afterDarkGlow');
  if (afterDark && afterDarkGlow) {
    afterDark.addEventListener('mousemove', (e) => {
      const rect = afterDark.getBoundingClientRect();
      const gx = ((e.clientX - rect.left) / rect.width) * 100;
      const gy = ((e.clientY - rect.top) / rect.height) * 100;
      afterDarkGlow.style.setProperty('--gx', `${gx}%`);
      afterDarkGlow.style.setProperty('--gy', `${gy}%`);
    });
  }

  /* ------------------------------------------------------------------ */
  /* JAPAN x KOREA interactive split                                     */
  /* ------------------------------------------------------------------ */
  const duel = document.getElementById('duel');
  const duelJapan = document.getElementById('duelJapan');
  const duelKorea = document.getElementById('duelKorea');
  if (duel && duelJapan && duelKorea && finePointerQuery.matches) {
    duel.addEventListener('mousemove', (e) => {
      const rect = duel.getBoundingClientRect();
      const frac = clamp01((e.clientX - rect.left) / rect.width);
      const leftPct = 35 + frac * 30; // 35 - 65
      duelJapan.style.flexBasis = `${leftPct}%`;
      duelKorea.style.flexBasis = `${100 - leftPct}%`;
    });
    duel.addEventListener('mouseleave', () => {
      duelJapan.style.flexBasis = '50%';
      duelKorea.style.flexBasis = '50%';
    });
  }

  /* ------------------------------------------------------------------ */
  /* rAF-driven scroll updates                                           */
  /* ------------------------------------------------------------------ */
  let ticking = false;
  function onScroll() {
    updateRail(); // cheap (9 rects) — always run immediately, never gated
    if (!ticking) {
      requestAnimationFrame(() => {
        updateCraft();
        updateProcess();
        ticking = false;
      });
      ticking = true;
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  onScroll();

  /* ------------------------------------------------------------------ */
  /* Fullscreen menu overlay                                             */
  /* ------------------------------------------------------------------ */
  const menuOverlay = document.getElementById('menuOverlay');
  const menuOpenBtn = document.getElementById('menuOpenBtn');
  const menuCloseBtn = document.getElementById('menuCloseBtn');
  const menuCats = document.querySelectorAll('.menu-cat');
  const menuItemLists = document.querySelectorAll('.menu-items');
  const menuVisualImgs = document.querySelectorAll('.menu-visual img');

  function openMenu() {
    menuOverlay.classList.add('is-open');
    body.classList.add('menu-open');
  }
  function closeMenu() {
    menuOverlay.classList.remove('is-open');
    body.classList.remove('menu-open');
  }
  if (menuOpenBtn) menuOpenBtn.addEventListener('click', openMenu);
  if (menuCloseBtn) menuCloseBtn.addEventListener('click', closeMenu);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && menuOverlay.classList.contains('is-open')) closeMenu();
  });

  function setCategory(cat) {
    menuCats.forEach((btn) => btn.classList.toggle('is-active', btn.dataset.cat === cat));
    menuItemLists.forEach((ul) => ul.classList.toggle('is-active', ul.dataset.catItems === cat));
    menuVisualImgs.forEach((img) => img.classList.toggle('is-active', img.dataset.catImg === cat));
  }
  menuCats.forEach((btn) => {
    btn.addEventListener('mouseenter', () => setCategory(btn.dataset.cat));
    btn.addEventListener('click', () => setCategory(btn.dataset.cat));
    btn.addEventListener('focus', () => setCategory(btn.dataset.cat));
  });


})();
