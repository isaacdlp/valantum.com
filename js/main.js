/* ═══════════════════════════════════════════════════════════════════════════
   Brentford Capital — Main JavaScript
   Slideshow · Navigation · Scroll Reveal · Mobile Menu · Smooth Scroll
   ═══════════════════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  /* ─── Utility ────────────────────────────────────────────────────────── */
  const qs  = (sel, ctx = document) => ctx.querySelector(sel);
  const qsa = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

  /* ─── Hero Slideshow ─────────────────────────────────────────────────── */
  const slides     = qsa('.hero-slide');
  const dots       = qsa('.hero-dot');
  const INTERVAL   = 7000;
  let   current    = 0;
  let   timer      = null;

  function showSlide(n) {
    slides[current].classList.remove('active');
    dots[current].classList.remove('active');
    current = (n + slides.length) % slides.length;
    slides[current].classList.add('active');
    dots[current].classList.add('active');
  }

  function nextSlide() { showSlide(current + 1); }

  function startTimer() {
    clearInterval(timer);
    timer = setInterval(nextSlide, INTERVAL);
  }

  if (slides.length > 0) {
    dots.forEach((dot, i) => {
      dot.addEventListener('click', () => { showSlide(i); startTimer(); });
    });
    startTimer();
  }

  /* ─── Hero Text Reveal on Load ───────────────────────────────────────── */
  function triggerHeroReveal() {
    document.body.classList.add('loaded');
  }

  if (document.readyState === 'complete') {
    // already loaded
    setTimeout(triggerHeroReveal, 80);
  } else {
    window.addEventListener('load', () => setTimeout(triggerHeroReveal, 80));
  }

  /* ─── Navigation — Scroll Effect ────────────────────────────────────── */
  const nav = qs('#nav');

  function onScroll() {
    nav.classList.toggle('scrolled', window.scrollY > 50);
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll(); // run once on init

  /* ─── Mobile Menu ────────────────────────────────────────────────────── */
  const hamburger = qs('#hamburger');
  const navLinks  = qs('#navLinks');
  const navCta    = qs('.nav-cta');

  if (hamburger && navLinks) {
    hamburger.addEventListener('click', () => {
      const open = hamburger.classList.toggle('open');
      hamburger.setAttribute('aria-expanded', open);
      navLinks.classList.toggle('is-open', open);
      if (navCta) navCta.classList.toggle('is-open', open);
      // Always force scrolled state so nav bg shows when menu open
      if (open) nav.classList.add('scrolled');
      else if (window.scrollY <= 50) nav.classList.remove('scrolled');
    });

    // Close on link click
    qsa('a', navLinks).forEach(link => {
      link.addEventListener('click', () => {
        hamburger.classList.remove('open');
        hamburger.setAttribute('aria-expanded', 'false');
        navLinks.classList.remove('is-open');
        if (navCta) navCta.classList.remove('is-open');
      });
    });

    // Close on outside click
    document.addEventListener('click', e => {
      if (!nav.contains(e.target)) {
        hamburger.classList.remove('open');
        hamburger.setAttribute('aria-expanded', 'false');
        navLinks.classList.remove('is-open');
        if (navCta) navCta.classList.remove('is-open');
      }
    });
  }

  /* ─── Scroll Reveal — IntersectionObserver ───────────────────────────── */
  const revealEls = qsa('.reveal');

  if ('IntersectionObserver' in window && revealEls.length > 0) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

    revealEls.forEach(el => observer.observe(el));
    window._revealObserver = observer; // expose for dynamic content (e.g. Substack feed)
  } else {
    // Fallback — show all
    revealEls.forEach(el => el.classList.add('visible'));
  }

  /* ─── Stagger children inside grid containers ────────────────────────── */
  const staggerContainers = [
    '.pillars-grid',
    '.services-grid',
    '.insights-grid',
    '.approach-grid',
  ];

  staggerContainers.forEach(sel => {
    const container = qs(sel);
    if (!container) return;
    qsa('.reveal', container).forEach((child, i) => {
      child.classList.add(`stagger-${(i % 4) + 1}`);
    });
  });

  /* ─── Contact Form — AJAX Submission ────────────────────────────────── */
  const contactForm = qs('.contact-form');

  if (contactForm) {
    contactForm.addEventListener('submit', async function (e) {
      e.preventDefault();

      const btn    = qs('.contact-form-submit', contactForm);
      const status = qs('.contact-form-status', contactForm);

      btn.disabled    = true;
      btn.textContent = 'Sending…';
      status.textContent = '';
      status.className   = 'contact-form-status';

      try {
        const res = await fetch(contactForm.action, {
          method:  'POST',
          headers: { 'Accept': 'application/json' },
          body:    new FormData(contactForm),
        });

        if (res.ok) {
          status.textContent = 'Message sent successfully. We\'ll be in touch shortly.';
          status.classList.add('contact-form-status--ok');
          contactForm.reset();
          btn.textContent = 'Send a Message';
        } else {
          throw new Error('server');
        }
      } catch {
        status.textContent = 'Error sending the message. Please try again or email us directly.';
        status.classList.add('contact-form-status--err');
        btn.textContent = 'Send a Message';
      }

      btn.disabled = false;
    });
  }

  /* ─── Smooth Scroll for Anchor Links ─────────────────────────────────── */
  document.addEventListener('click', e => {
    const link = e.target.closest('a[href^="#"]');
    if (!link) return;
    const id = link.getAttribute('href');
    if (id === '#') return;
    const target = qs(id);
    if (!target) return;
    e.preventDefault();
    const offset = parseInt(getComputedStyle(document.documentElement)
      .getPropertyValue('--nav-h') || '80', 10);
    const top = target.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top, behavior: 'smooth' });
  });

  /* ─── Active nav link highlight on scroll ───────────────────────────── */
  const sections = qsa('section[id], header[id]');
  const navAnchors = qsa('.nav-link[href^="#"]');

  function updateActiveLink() {
    let closest = null;
    let minDist = Infinity;
    sections.forEach(sec => {
      const rect = sec.getBoundingClientRect();
      const dist = Math.abs(rect.top - 100);
      if (dist < minDist) { minDist = dist; closest = sec.id; }
    });
    navAnchors.forEach(a => {
      a.classList.toggle('active', a.getAttribute('href') === `#${closest}`);
    });
  }

  window.addEventListener('scroll', updateActiveLink, { passive: true });

})();

/* ═══════════════════════════════════════════════════════════════════════════
   Substack Insights Feed
   Fetches the 3 latest posts from brentfordcapital.substack.com and renders
   them into the #insights-grid using the existing insight-card styles.
   ═══════════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  const FEED_URL  = 'https://brentfordcapital.substack.com/feed';
  const API_URL   = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(FEED_URL)}`;
  const FALLBACK_IMG = 'https://images.unsplash.com/photo-1486325212027-8081e485255e?auto=format&fit=crop&w=800&q=80';

  /* Unsplash fallback pool — cycles through if multiple cards lack a thumbnail */
  const FALLBACKS = [
    'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=800&q=80',
  ];

  function stripHtml(html) {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  }

  function formatDate(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  }

  function isoDate(dateStr) {
    return new Date(dateStr).toISOString().slice(0, 10);
  }

  function buildCard(item, fallbackIndex) {
    const img        = item.thumbnail || item.enclosure?.link || FALLBACKS[fallbackIndex % FALLBACKS.length];
    const category   = (item.categories && item.categories.length) ? item.categories[0] : 'Markets';
    const snippet    = stripHtml(item.description).trim().replace(/\s+/g, ' ').slice(0, 160) + '…';

    return `
      <article class="insight-card reveal">
        <a href="${item.link}" target="_blank" rel="noopener" aria-label="Read: ${item.title.replace(/"/g, '&quot;')}">
          <div class="insight-img"
               style="background-image:url('${img}')"
               role="img" aria-label="${category}">
            <!--<span class="insight-cat">${category}</span>-->
          </div>
        </a>
        <div class="insight-body">
          <time class="insight-date" datetime="${isoDate(item.pubDate)}">${formatDate(item.pubDate)}</time>
          <h3>${item.title}</h3>
          <p>${snippet}</p>
          <a href="${item.link}" target="_blank" rel="noopener" class="insight-link">Read More &rarr;</a>
        </div>
      </article>`;
  }

  function renderError(grid) {
    grid.innerHTML = `
      <div class="insights-error">
        Unable to load insights at this time. Visit
        <a href="https://brentfordcapital.substack.com" target="_blank" rel="noopener">our Substack</a>
        for the latest perspectives.
      </div>`;
  }

  const grid = document.getElementById('insights-grid');
  if (!grid) return;

  fetch(API_URL)
    .then(function (res) { return res.json(); })
    .then(function (data) {
      if (!data.items || !data.items.length) { renderError(grid); return; }
      const items = data.items.slice(0, 3);
      grid.innerHTML = items.map(function (item, i) { return buildCard(item, i); }).join('');

      /* Re-trigger scroll-reveal observer on the freshly added cards */
      if (window._revealObserver) {
        grid.querySelectorAll('.reveal').forEach(function (el) {
          window._revealObserver.observe(el);
        });
      }
    })
    .catch(function () { renderError(grid); });
})();
