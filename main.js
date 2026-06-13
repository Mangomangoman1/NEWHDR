// ═══════════════════════════════════════════════════════════
//   HAILEY DEVICE REPAIR — main.js
// ═══════════════════════════════════════════════════════════

(function () {
  'use strict';

  // ─── Promo banner: removed ─────────────────────────────────

  // ─── Theme toggle ────────────────────────────────────────
  const html = document.documentElement;
  const themeToggles = Array.from(document.querySelectorAll('.theme-toggle'));
  const THEME_KEY = 'hdr-theme';
  const themeColorMeta = document.querySelector('meta[name="theme-color"]');

  function syncThemeControls(theme) {
    const isLight = theme === 'light';
    themeToggles.forEach((toggle) => {
      toggle.setAttribute('aria-pressed', String(isLight));
      toggle.setAttribute('aria-label', isLight ? 'Switch to dark theme' : 'Switch to light theme');
      const label = toggle.querySelector('.theme-toggle-label');
      if (label) label.textContent = isLight ? 'Dark' : 'Light';
    });
    if (themeColorMeta) themeColorMeta.setAttribute('content', isLight ? '#f5f6f3' : '#0d1117');
  }

  function setTheme(theme, announce) {
    html.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_KEY, theme);
    syncThemeControls(theme);
    if (announce !== false) announceToSR(theme === 'dark' ? 'Dark theme enabled' : 'Light theme enabled');
  }

  // Screen reader live announcements
  function announceToSR(msg) {
    let el = document.getElementById('srAnnounce');
    if (!el) {
      el = document.createElement('div');
      el.id = 'srAnnounce';
      el.setAttribute('role', 'status');
      el.setAttribute('aria-live', 'polite');
      el.setAttribute('aria-atomic', 'true');
      el.className = 'sr-only';
      document.body.appendChild(el);
    }
    el.textContent = '';
    requestAnimationFrame(() => { el.textContent = msg; });
  }

  // Init: keep the public site dark while the light theme is still being polished.
  // Also clear any earlier light-theme choice so returning customers do not stay in the experiment.
  localStorage.removeItem(THEME_KEY);
  setTheme('dark', false);

  themeToggles.forEach((themeToggle) => {
    themeToggle.addEventListener('click', () => {
      const current = html.getAttribute('data-theme');
      setTheme(current === 'dark' ? 'light' : 'dark');
    });
  });

  // ─── Cookie consent banner ───────────────────────────────
  const cookieBanner = document.getElementById('cookieBanner');
  const cookieAccept = document.getElementById('cookieAccept');
  const cookieDecline = document.getElementById('cookieDecline');
  if (cookieBanner && !localStorage.getItem('hdr_cookie_consent')) {
    const homeMobileDelay = document.body.classList.contains('home-page') && window.matchMedia('(max-width: 768px)').matches;
    setTimeout(() => cookieBanner.classList.add('visible'), homeMobileDelay ? 6500 : 1500);
  }
  function dismissCookie(choice) {
    localStorage.setItem('hdr_cookie_consent', choice);
    cookieBanner.classList.remove('visible');
    announceToSR('Cookie preferences saved');
  }
  if (cookieAccept) cookieAccept.addEventListener('click', () => dismissCookie('accepted'));
  if (cookieDecline) cookieDecline.addEventListener('click', () => dismissCookie('declined'));
  if (cookieBanner) {
    cookieBanner.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') dismissCookie('declined');
    });
  }

  // ─── Nav: scroll shadow ──────────────────────────────────
  const nav = document.getElementById('nav') || document.getElementById('mainNav');
  if (nav) {
    window.addEventListener('scroll', () => {
      nav.classList.toggle('scrolled', window.scrollY > 10);
    }, { passive: true });
  }

  // ─── Mobile nav hamburger ────────────────────────────────
  const hamburger = document.getElementById('navHamburger') || document.getElementById('navToggle');
  const mobileMenu = document.getElementById('navMobile');
  const navBackdrop = document.getElementById('navBackdrop');

  if (hamburger && mobileMenu) {
    const closeMenu = () => {
      hamburger.setAttribute('aria-expanded', 'false');
      mobileMenu.classList.remove('open');
      mobileMenu.setAttribute('aria-hidden', 'true');
      mobileMenu.hidden = true;
      document.body.classList.remove('menu-open');
      if (navBackdrop) navBackdrop.classList.remove('visible');
      hamburger.focus();
    };
    const openMenu = () => {
      hamburger.setAttribute('aria-expanded', 'true');
      mobileMenu.hidden = false;
      mobileMenu.classList.add('open');
      mobileMenu.setAttribute('aria-hidden', 'false');
      document.body.classList.add('menu-open');
      if (navBackdrop) navBackdrop.classList.add('visible');
      // Focus first link in mobile menu
      const firstLink = mobileMenu.querySelector('a');
      if (firstLink) firstLink.focus();
    };

    hamburger.addEventListener('click', () => {
      const expanded = hamburger.getAttribute('aria-expanded') === 'true';
      expanded ? closeMenu() : openMenu();
    });

    // Close on link click
    mobileMenu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', closeMenu);
    });

    // Escape key closes menu
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && mobileMenu.classList.contains('open')) {
        closeMenu();
      }
    });

    // Backdrop click closes menu
    if (navBackdrop) {
      navBackdrop.addEventListener('click', closeMenu);
    }

    // Focus trap inside mobile menu
    mobileMenu.addEventListener('keydown', (e) => {
      if (e.key !== 'Tab') return;
      const focusable = mobileMenu.querySelectorAll('a, button, [tabindex]:not([tabindex="-1"])');
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    });
  }

  // ─── Scroll animations (IntersectionObserver) ────────────
  const animEls = document.querySelectorAll('[data-animate]');
  if (animEls.length) document.documentElement.classList.add('animate-ready');

  if ('IntersectionObserver' in window && animEls.length) {
    // Track per-parent stagger counters so concurrent siblings animate in sequence
    const parentCounters = new WeakMap();

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const parent = entry.target.parentElement;
        const count = parentCounters.get(parent) || 0;
        parentCounters.set(parent, count + 1);
        // Cap stagger at ~5 items to avoid long delays
        const delay = Math.min(count, 5) * 80;
        setTimeout(() => {
          entry.target.classList.add('visible');
        }, delay);
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -32px 0px' });

    animEls.forEach(el => observer.observe(el));
  } else {
    // Fallback: show everything immediately
    animEls.forEach(el => el.classList.add('visible'));
  }

  // ─── Contact form (validation + mailto fallback) ─────────
  const contactForm = document.getElementById('contactForm');
  const formSuccess = document.getElementById('formSuccess');

  // Inline validation helpers (defined early so submit can use them)
  const validators = {
    name: {
      test: v => v.trim().length >= 2,
      msg: 'Please enter your name (at least 2 characters)'
    },
    contact: {
      test: v => {
        const trimmed = v.trim();
        const phoneish = /[\d\s\-\+\(\)]{7,}/.test(trimmed);
        const emailish = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
        return phoneish || emailish;
      },
      msg: 'Please enter a valid phone number or email'
    },
    issue: {
      test: v => v.trim().length >= 5,
      msg: 'Please describe the issue (at least 5 characters)'
    }
  };

  function validateField(input) {
    const key = input.name || input.id;
    const validator = validators[key] || validators[input.id];
    if (!validator) return true;

    const errorEl = document.getElementById(key + 'Error') || document.getElementById(input.id + 'Error');
    const isValid = validator.test(input.value);

    if (!isValid && input.value.length > 0) {
      input.classList.add('invalid');
      input.classList.remove('valid');
      if (errorEl) errorEl.textContent = validator.msg;
      return false;
    } else if (isValid) {
      input.classList.remove('invalid');
      input.classList.add('valid');
      if (errorEl) errorEl.textContent = '';
      return true;
    } else {
      input.classList.remove('invalid', 'valid');
      if (errorEl) errorEl.textContent = '';
      return false;
    }
  }

  if (contactForm) {
    // Bind blur/input validation
    ['name', 'contact', 'issue'].forEach(id => {
      const input = contactForm.querySelector(`[name="${id}"], #${id}`);
      if (input) {
        input.addEventListener('blur', () => validateField(input));
        input.addEventListener('input', () => {
          if (input.classList.contains('invalid')) validateField(input);
        });
      }
    });
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const nameInput    = contactForm.querySelector('#name');
      const contactInput = contactForm.querySelector('[name="contact"], #contact, #contactField');
      const issueInput   = contactForm.querySelector('#issue');
      const deviceInput  = contactForm.querySelector('#device');
      const modelInput   = contactForm.querySelector('#model');
      const serviceInput = contactForm.querySelector('#service');
      const mailinInput  = contactForm.querySelector('#mailinCheck');
      const name    = nameInput ? nameInput.value.trim() : '';
      const contact = contactInput ? contactInput.value.trim() : '';
      const device  = deviceInput ? deviceInput.value : '';
      const model   = modelInput ? modelInput.value.trim() : '';
      const service = serviceInput ? serviceInput.value : '';
      const issue   = issueInput ? issueInput.value.trim() : '';
      const mailin  = mailinInput ? mailinInput.checked : /mail-in/i.test(service);

      // Run inline validation on all required fields
      const fields = [nameInput, contactInput, issueInput].filter(Boolean);
      let allValid = true;
      fields.forEach(input => {
        if (!validateField(input)) {
          allValid = false;
        }
      });

      if (!allValid) {
        // Focus the first invalid field
        const firstInvalid = fields.find(f => f.classList.contains('invalid'));
        if (firstInvalid) firstInvalid.focus();
        return;
      }

      // ─── Submit via Formspree (or fallback to mailto) ───────
      const submitBtn = contactForm.querySelector('button[type="submit"]');
      const formError = document.getElementById('formError');
      const FORMSPREE_ID = contactForm.dataset.formspree; // set data-formspree="YOUR_ID" on <form>

      // Disable button + show spinner
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.dataset.originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<span class="material-symbols-outlined spin-icon" data-icon="progress_activity" aria-hidden="true"></span> Sending…';
      }

      if (FORMSPREE_ID) {
        // Real Formspree submission
        fetch(`https://formspree.io/f/${FORMSPREE_ID}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify({
            name: name,
            contact: contact,
            device: device || 'Not specified',
            model: model || 'Not specified',
            service: service || 'No preference',
            issue: issue,
            mailin: mailin ? 'Yes' : 'No'
          })
        })
        .then(response => {
          if (response.ok) {
            showFormSuccess();
          } else {
            throw new Error('Submission failed');
          }
        })
        .catch(() => {
          // Show error, re-enable button
          if (formError) {
            formError.hidden = false;
            formError.classList.add('visible');
            formError.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }
          restoreSubmitBtn();
        });
      } else {
        // Fallback: mailto (no Formspree ID configured)
        const subject = encodeURIComponent(`Quote Request — ${device || 'Device'} Repair`);
        const mailBody = encodeURIComponent(
          `Name: ${name}\nContact: ${contact}\nDevice: ${device || 'Not specified'}\n` +
          `Model: ${model || 'Not specified'}\nService method: ${service || 'No preference'}\n` +
          `Mail-In: ${mailin ? 'Yes' : 'No'}\n\nIssue:\n${issue}`
        );
        window.location.href = `mailto:samuel@haileyrepair.com?subject=${subject}&body=${mailBody}`;
        showFormSuccess();
      }

      function showFormSuccess() {
        if (formSuccess) {
          formSuccess.hidden = false;
          formSuccess.classList.add('visible');
          formSuccess.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
        contactForm.reset();
        // Hide success after 8 seconds
        setTimeout(() => {
          if (formSuccess) {
            formSuccess.classList.remove('visible');
            formSuccess.hidden = true;
          }
          restoreSubmitBtn();
        }, 8000);
      }

      function restoreSubmitBtn() {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = submitBtn.dataset.originalText || '<span class="material-symbols-outlined" data-icon="send" aria-hidden="true"></span> Send Quote Request';
        }
      }
    });
  }

  // ─── Recently Fixed ticker: clone items for seamless loop ─
  const tickerScroll = document.querySelector('.ticker-scroll');
  if (tickerScroll) {
    // Clone all ticker items to create seamless infinite loop
    const items = tickerScroll.querySelectorAll('.ticker-item');
    items.forEach(item => {
      const clone = item.cloneNode(true);
      tickerScroll.appendChild(clone);
    });
  }

  // ─── Smooth anchor offset for sticky nav ─────────────────
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const id = anchor.getAttribute('href').slice(1);
      if (!id) return;
      const target = document.getElementById(id);
      if (!target) return;
      e.preventDefault();
      const navH = nav ? nav.offsetHeight : 64;
      const top = target.getBoundingClientRect().top + window.scrollY - navH - 16;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });

  // ─── Active nav link on scroll ───────────────────────────
  const navLinks = document.querySelectorAll('.nav-links .nav-link');
  const sections = [];

  navLinks.forEach(link => {
    const id = link.getAttribute('href').replace('#', '');
    const section = document.getElementById(id);
    if (section) sections.push({ id, el: section, link });
  });

  function updateActiveNav() {
    const navH = nav ? nav.offsetHeight : 64;
    const scrollY = window.scrollY + navH + 100;
    let current = '';

    sections.forEach(({ id, el }) => {
      if (el.offsetTop <= scrollY) current = id;
    });

    navLinks.forEach(link => {
      const isActive = link.getAttribute('href') === '#' + current;
      link.classList.toggle('active', isActive);
    });
  }

  if (sections.length) {
    window.addEventListener('scroll', updateActiveNav, { passive: true });
    updateActiveNav();
  }

  // ─── Count-up animation for trust stats ──────────────────
  const countEls = document.querySelectorAll('[data-countup]');

  if ('IntersectionObserver' in window && countEls.length) {
    const countObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        countObserver.unobserve(el);

        const end = parseInt(el.getAttribute('data-countup'), 10);
        const prefix = el.getAttribute('data-prefix') || '';
        const suffix = el.getAttribute('data-suffix') || '';
        const duration = 1200;
        const start = performance.now();

        function tick(now) {
          const elapsed = now - start;
          const progress = Math.min(elapsed / duration, 1);
          // Ease-out cubic
          const eased = 1 - Math.pow(1 - progress, 3);
          const current = Math.round(eased * end);
          el.textContent = prefix + current + suffix;
          if (progress < 1) requestAnimationFrame(tick);
        }

        requestAnimationFrame(tick);
      });
    }, { threshold: 0.5 });

    countEls.forEach(el => countObserver.observe(el));
  }

  // ─── Scroll progress bar ──────────────────────────────────
  const progressBar = document.getElementById('scrollProgress');
  if (progressBar) {
    function updateProgress() {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      progressBar.style.width = progress + '%';
    }
    window.addEventListener('scroll', updateProgress, { passive: true });
    updateProgress();
  }

  // ─── Hero phrase effect (full phrases only — no broken mid-word states) ─────────────
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const typerEl = document.getElementById('heroTyper');
  if (typerEl && !prefersReducedMotion) {
    const phrases = [
      'Let me fix it.',
      'Save hundreds.',
      'Same-day repair.',
      'Text me anytime.'
    ];
    let phraseIndex = 0;

    setInterval(() => {
      phraseIndex = (phraseIndex + 1) % phrases.length;
      typerEl.classList.add('phrase-switching');
      window.setTimeout(() => {
        typerEl.textContent = phrases[phraseIndex];
        typerEl.classList.remove('phrase-switching');
      }, 140);
    }, 3400);
  }

  // ─── Hero accent shimmer (one-shot on load) ─────────────
  if (!prefersReducedMotion) {
    const heroAccent = document.querySelector('.hero-headline-accent');
    if (heroAccent) {
      setTimeout(() => heroAccent.classList.add('shimmer'), 800);
    }
  }

  // ─── Hero parallax glow ──────────────────────────────────
  if (!prefersReducedMotion) {
    const heroGlows = document.querySelectorAll('.hero-glow, .hero-glow-1');
    if (heroGlows.length) {
      let ticking = false;
      document.addEventListener('mousemove', (e) => {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(() => {
          const cx = (e.clientX / window.innerWidth - 0.5) * 2;  // -1 to 1
          const cy = (e.clientY / window.innerHeight - 0.5) * 2;
          heroGlows.forEach((glow, i) => {
            const factor = (i + 1) * 15;
            glow.style.transform = `translate(${cx * factor}px, ${cy * factor}px)`;
          });
          ticking = false;
        });
      }, { passive: true });
    }
  }

  // ─── Review carousel ────────────────────────────────────
  const carousel = document.getElementById('reviewCarousel');
  if (carousel) {
    const slides = carousel.querySelectorAll('.carousel-slide');
    const dots = carousel.querySelectorAll('.carousel-dot');
    let currentSlide = 0;
    let autoTimer = null;
    const AUTO_INTERVAL = 5000;

    function goToSlide(index) {
      // Exit current
      slides[currentSlide].classList.remove('carousel-slide--active');
      slides[currentSlide].classList.add('carousel-slide--exit');
      dots[currentSlide].classList.remove('carousel-dot--active');
      dots[currentSlide].setAttribute('aria-selected', 'false');

      // Clear exit class after animation
      const prevSlide = slides[currentSlide];
      setTimeout(() => prevSlide.classList.remove('carousel-slide--exit'), 500);

      // Enter new
      currentSlide = index;
      slides[currentSlide].classList.add('carousel-slide--active');
      dots[currentSlide].classList.add('carousel-dot--active');
      dots[currentSlide].setAttribute('aria-selected', 'true');
    }

    function nextSlide() {
      goToSlide((currentSlide + 1) % slides.length);
    }

    function startAuto() {
      stopAuto();
      if (!prefersReducedMotion) {
        autoTimer = setInterval(nextSlide, AUTO_INTERVAL);
      }
    }

    function stopAuto() {
      if (autoTimer) {
        clearInterval(autoTimer);
        autoTimer = null;
      }
    }

    dots.forEach((dot, i) => {
      dot.addEventListener('click', () => {
        if (i !== currentSlide) {
          goToSlide(i);
          startAuto(); // Reset timer on manual interaction
        }
      });
    });

    // Pause on hover
    carousel.addEventListener('mouseenter', stopAuto);
    carousel.addEventListener('mouseleave', startAuto);

    // Start auto-rotate
    startAuto();
  }

  // ─── Button ripple effect ────────────────────────────────
  document.querySelectorAll('.btn').forEach(btn => {
    btn.addEventListener('click', function (e) {
      const ripple = document.createElement('span');
      ripple.classList.add('btn-ripple');
      const rect = this.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      ripple.style.width = ripple.style.height = size + 'px';
      ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
      ripple.style.top = (e.clientY - rect.top - size / 2) + 'px';
      this.appendChild(ripple);
      ripple.addEventListener('animationend', () => ripple.remove());
    });
  });

  // ─── Before/After gallery sliders ────────────────────────
  document.querySelectorAll('[data-gallery-slider]').forEach(slider => {
    const before = slider.querySelector('.gallery-before');
    const handle = slider.querySelector('.gallery-handle');
    if (!before || !handle) return;

    let isDragging = false;

    function setPosition(x) {
      const rect = slider.getBoundingClientRect();
      let pct = ((x - rect.left) / rect.width) * 100;
      pct = Math.max(5, Math.min(95, pct));
      before.style.clipPath = 'inset(0 ' + (100 - pct) + '% 0 0)';
      handle.style.left = pct + '%';
      handle.setAttribute('aria-valuenow', Math.round(pct));
    }

    slider.addEventListener('pointerdown', e => {
      isDragging = true;
      slider.setPointerCapture(e.pointerId);
      setPosition(e.clientX);
    });

    slider.addEventListener('pointermove', e => {
      if (!isDragging) return;
      setPosition(e.clientX);
    });

    slider.addEventListener('pointerup', () => { isDragging = false; });
    slider.addEventListener('pointercancel', () => { isDragging = false; });

    // Keyboard support
    handle.addEventListener('keydown', e => {
      const rect = slider.getBoundingClientRect();
      const currentPct = parseFloat(handle.getAttribute('aria-valuenow')) || 50;
      let newPct = currentPct;
      if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
        newPct = Math.max(5, currentPct - 5);
        e.preventDefault();
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
        newPct = Math.min(95, currentPct + 5);
        e.preventDefault();
      }
      if (newPct !== currentPct) {
        before.style.clipPath = 'inset(0 ' + (100 - newPct) + '% 0 0)';
        handle.style.left = newPct + '%';
        handle.setAttribute('aria-valuenow', Math.round(newPct));
      }
    });

    // Prevent img drag (for when real images are added)
    slider.addEventListener('dragstart', e => e.preventDefault());
  });

  /* ── REVIEWS PAGE: Filter by category ──────────────────── */
  const filterBtns = document.querySelectorAll('.reviews-filter-btn');
  const reviewCards = document.querySelectorAll('.review-full-card');
  const reviewsEmpty = document.getElementById('reviewsEmpty');

  if (filterBtns.length && reviewCards.length) {
    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const filter = btn.dataset.filter;

        // Update active state
        filterBtns.forEach(b => {
          b.classList.remove('reviews-filter-btn--active');
          b.setAttribute('aria-selected', 'false');
        });
        btn.classList.add('reviews-filter-btn--active');
        btn.setAttribute('aria-selected', 'true');

        // Filter cards
        let visible = 0;
        reviewCards.forEach(card => {
          const cats = card.dataset.category || '';
          const show = filter === 'all' || cats.split(' ').includes(filter);
          card.hidden = !show;
          if (show) visible++;
        });

        // Show/hide empty state
        if (reviewsEmpty) reviewsEmpty.hidden = visible > 0;
      });
    });
  }

  /* ── Page curtain fail-safe ────────────────── */
  const curtain = document.getElementById('pageCurtain');
  if (curtain) {
    // The curtain is decorative only. It must never hide content or trap taps.
    const removeCurtain = () => curtain.classList.add('done');
    removeCurtain();
    window.addEventListener('pageshow', removeCurtain);
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) removeCurtain();
    });
  }

  /* ── 3D card tilt ────────────────────── */
  document.querySelectorAll('.card-tilt').forEach(card => {
    if (window.matchMedia('(hover: none), (pointer: coarse), (prefers-reduced-motion: reduce)').matches) return;

    let rect = null;
    let raf = 0;
    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;
    const maxTilt = 4.5;
    const ease = 0.18;

    function render() {
      currentX += (targetX - currentX) * ease;
      currentY += (targetY - currentY) * ease;
      card.style.setProperty('--tilt-x', currentX.toFixed(3) + 'deg');
      card.style.setProperty('--tilt-y', currentY.toFixed(3) + 'deg');

      if (Math.abs(targetX - currentX) > 0.01 || Math.abs(targetY - currentY) > 0.01) {
        raf = requestAnimationFrame(render);
      } else {
        raf = 0;
      }
    }

    function queue() {
      if (!raf) raf = requestAnimationFrame(render);
    }

    card.addEventListener('pointerenter', () => {
      rect = card.getBoundingClientRect();
      card.classList.add('is-tilting');
    }, { passive: true });

    card.addEventListener('pointermove', e => {
      if (!rect) rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const midX = rect.width / 2;
      const midY = rect.height / 2;
      targetY = ((x - midX) / midX) * maxTilt;
      targetX = ((midY - y) / midY) * maxTilt;
      queue();
    }, { passive: true });

    card.addEventListener('pointerleave', () => {
      rect = null;
      targetX = 0;
      targetY = 0;
      card.classList.remove('is-tilting');
      queue();
    }, { passive: true });
  });

  /* ── Hero PCB canvas ─────────────────── */
  (function () {
    const canvas = document.getElementById('pcb-canvas');
    if (!canvas) return;
    if (window.matchMedia('(max-width: 768px)').matches) return;

    const ctx = canvas.getContext('2d');
    const CELL=38,TRACE_WIDTH=1.5,NODE_RADIUS=4,TRACE_MAX_OP=0.16,NODE_MAX_OP=0.28,DECAY_RATE=0.0028,LOOK_AHEAD=0.28,NUM_WALKERS=22,SPEED_MIN=0.28,SPEED_MAX=0.65,NODE_PLACE_PROB=0.5,COVERAGE=0.38,HOVER_RADIUS=68;
    let cols,rows,traces=[],nodes=[],traceMap=new Map(),walkers=[],animId,lastTime=0,hoveredKey=null;
    const DIRS=[{dc:0,dr:-1},{dc:0,dr:1},{dc:-1,dr:0},{dc:1,dr:0}];
    function shuffle(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a;}
    function px(c){return c*CELL;} function py(r){return r*CELL;} function nkey(c,r){return`${c},${r}`;}
    function buildNetwork(){
      traces=[];nodes=[];traceMap=new Map();
      const grid=Array.from({length:rows},()=>Array.from({length:cols},()=>({traced:false,nodeAt:false})));
      const target=Math.floor(cols*rows*COVERAGE);let filled=0;
      const seeds=Math.max(8,Math.floor(cols*rows/45));
      for(let s=0;s<seeds*3&&filled<target;s++){
        const sc=1+Math.floor(Math.random()*(cols-2)),sr=1+Math.floor(Math.random()*(rows-2));
        if(grid[sr][sc].traced)continue;
        grid[sr][sc].traced=true;grid[sr][sc].nodeAt=true;nodes.push({col:sc,row:sr});filled++;
        let c=sc,r=sr;const maxSteps=Math.floor(cols*rows/seeds*3.5);
        for(let step=0;step<maxSteps&&filled<target;step++){
          const dirs=shuffle([...DIRS]);let moved=false;
          for(const d of dirs){
            const nc=c+d.dc,nr=r+d.dr;
            if(nc<1||nc>=cols-1||nr<1||nr>=rows-1)continue;
            if(grid[nr][nc].traced&&Math.random()>0.18)continue;
            traces.push({x1:c,y1:r,x2:nc,y2:nr,life:0,extent:0});
            if(!grid[nr][nc].traced){grid[nr][nc].traced=true;filled++;}
            if(!grid[nr][nc].nodeAt&&Math.random()<NODE_PLACE_PROB){grid[nr][nc].nodeAt=true;nodes.push({col:nc,row:nr});}
            c=nc;r=nr;moved=true;break;
          }
          if(!moved)break;
        }
        if(!grid[r][c].nodeAt){grid[r][c].nodeAt=true;nodes.push({col:c,row:r});}
      }
      traces.forEach((t,i)=>{for(const k of[nkey(t.x1,t.y1),nkey(t.x2,t.y2)]){if(!traceMap.has(k))traceMap.set(k,[]);traceMap.get(k).push(i);}});
    }
    function spawnWalker(fromCol,fromRow,isHover=false){
      const k=nkey(fromCol,fromRow),pool=traceMap.get(k);
      if(!pool||!pool.length)return;
      const idx=pool[Math.floor(Math.random()*pool.length)],t=traces[idx];
      walkers.push({idx,forward:t.x1===fromCol&&t.y1===fromRow,progress:0,speed:SPEED_MIN+Math.random()*(SPEED_MAX-SPEED_MIN),trail:[],isHover,hopsLeft:isHover?3:-1});
    }
    function initWalkers(){walkers=[];for(let i=0;i<NUM_WALKERS;i++){if(!nodes.length)break;const n=nodes[Math.floor(Math.random()*nodes.length)];spawnWalker(n.col,n.row);}}
    function animate(now){
      animId=requestAnimationFrame(animate);
      if(!lastTime){lastTime=now;return;}
      const dt=Math.min((now-lastTime)/1000,0.05);lastTime=now;
      for(const t of traces){t.life=Math.max(0,t.life-DECAY_RATE);if(t.life===0)t.extent=0;}
      for(let i=walkers.length-1;i>=0;i--){
        const w=walkers[i],t=traces[w.idx];
        t.life=1;t.extent=Math.max(t.extent,Math.min(1,w.progress+LOOK_AHEAD));
        if(w.progress>0.25){
          const endC=w.forward?t.x2:t.x1,endR=w.forward?t.y2:t.y1,la=(w.progress-0.25)/0.75;
          for(const ni of(traceMap.get(nkey(endC,endR))||[])){if(ni!==w.idx){traces[ni].life=Math.max(traces[ni].life,la*0.55);traces[ni].extent=Math.max(traces[ni].extent,la*0.45);}}
        }
        w.progress+=w.speed*dt;
        if(w.progress>=1){
if(w.hopsLeft===0){walkers.splice(i,1);continue;}
          const endC=w.forward?t.x2:t.x1,endR=w.forward?t.y2:t.y1;
          const next=(traceMap.get(nkey(endC,endR))||[]).filter(x=>x!==w.idx);
          if(!next.length){walkers.splice(i,1);continue;}
          const ni=next[Math.floor(Math.random()*next.length)],nt=traces[ni];
          w.forward=nt.x1===endC&&nt.y1===endR;w.idx=ni;w.progress=0;w.trail=[];
          if(w.hopsLeft>0)w.hopsLeft--;
        }
      }
      let regular=walkers.filter(w=>!w.isHover).length,attempts=0;
      while(regular<NUM_WALKERS&&attempts++<40){const n=nodes[Math.floor(Math.random()*nodes.length)];spawnWalker(n.col,n.row);regular++;}
      ctx.clearRect(0,0,canvas.width,canvas.height);
      for(const t of traces){
        if(t.life<0.01||t.extent<0.01)continue;
        const x1=px(t.x1),y1=py(t.y1),x2=px(t.x2),y2=py(t.y2);
        ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x1+(x2-x1)*t.extent,y1+(y2-y1)*t.extent);
        ctx.strokeStyle=`rgba(192,200,210,${t.life*TRACE_MAX_OP})`;ctx.lineWidth=TRACE_WIDTH;ctx.lineCap='round';ctx.stroke();
      }
      for(const n of nodes){
        const connected=traceMap.get(nkey(n.col,n.row))||[];
        const life=connected.reduce((m,i)=>Math.max(m,traces[i].life),0);
        if(life<0.04)continue;
        ctx.shadowBlur=1+life*3;ctx.shadowColor=`rgba(180,210,240,${life*0.2})`;
        ctx.beginPath();ctx.arc(px(n.col),py(n.row),NODE_RADIUS*Math.min(1,0.4+life*0.8),0,Math.PI*2);
        ctx.fillStyle=`rgba(215,225,235,${life*NODE_MAX_OP})`;ctx.fill();ctx.shadowBlur=0;
      }
      for(const w of walkers){
        const t=traces[w.idx];
        const x1=w.forward?px(t.x1):px(t.x2),y1=w.forward?py(t.y1):py(t.y2);
        const x2=w.forward?px(t.x2):px(t.x1),y2=w.forward?py(t.y2):py(t.y1);
        const cx=x1+(x2-x1)*w.progress,cy=y1+(y2-y1)*w.progress;
        w.trail.push({x:cx,y:cy});if(w.trail.length>18)w.trail.shift();
        for(let j=0;j<w.trail.length;j++){const frac=w.trail.length>1?j/(w.trail.length-1):1;ctx.beginPath();ctx.arc(w.trail[j].x,w.trail[j].y,1.4+frac*0.8,0,Math.PI*2);ctx.fillStyle=`rgba(200,218,235,${frac*(w.isHover?0.20:0.13)})`;ctx.fill();}
        ctx.shadowBlur=w.isHover?6:4;ctx.shadowColor=w.isHover?'rgba(160,220,255,0.45)':'rgba(220,235,255,0.35)';
        ctx.beginPath();ctx.arc(cx,cy,w.isHover?2.8:2.2,0,Math.PI*2);ctx.fillStyle='rgba(255,255,255,0.75)';ctx.fill();ctx.shadowBlur=0;
      }
    }
    window.addEventListener('mousemove',function(e){
      const rect=canvas.getBoundingClientRect(),mx=e.clientX-rect.left,my=e.clientY-rect.top;
      let nearest=null,nearestDist=HOVER_RADIUS;
      for(const n of nodes){const dx=px(n.col)-mx,dy=py(n.row)-my,d=Math.sqrt(dx*dx+dy*dy);if(d<nearestDist){nearestDist=d;nearest=n;}}
      const k=nearest?nkey(nearest.col,nearest.row):null;
      if(k!==hoveredKey){hoveredKey=k;if(nearest){const pool=traceMap.get(k)||[],picked=shuffle([...pool]).slice(0,1);for(const idx of picked){const t=traces[idx];walkers.push({idx,forward:t.x1===nearest.col&&t.y1===nearest.row,progress:0,speed:0.9+Math.random()*0.4,trail:[],isHover:true,hopsLeft:3});}}}
    });
    function resize(){
      if(animId){cancelAnimationFrame(animId);animId=null;}
      canvas.width=canvas.offsetWidth;canvas.height=canvas.offsetHeight;
      // Canvas is display:none on mobile — skip building/animating so the
      // walker loop never runs against an empty (nodeless) network.
      if(!canvas.width||!canvas.height)return;
      cols=Math.ceil(canvas.width/CELL)+1;rows=Math.ceil(canvas.height/CELL)+1;
      buildNetwork();initWalkers();lastTime=0;animId=requestAnimationFrame(animate);
    }
    let resizeTimer;
    window.addEventListener('resize',()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(resize,150);});
    if(document.readyState==='complete'){resize();}else{window.addEventListener('load',resize);}
  })();
  /* ── Pricing page tabs ─────────────────── */
  const pricingTabs = document.querySelectorAll('.pricing-tab');
  if (pricingTabs.length) {
    pricingTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const target = tab.dataset.tab;
        // Deactivate all
        pricingTabs.forEach(t => {
          t.classList.remove('active');
          t.setAttribute('aria-selected', 'false');
        });
        document.querySelectorAll('.pricing-panel').forEach(p => {
          p.classList.remove('active');
          p.hidden = true;
        });
        // Activate selected
        tab.classList.add('active');
        tab.setAttribute('aria-selected', 'true');
        const panel = document.getElementById('panel-' + target);
        if (panel) {
          panel.classList.add('active');
          panel.hidden = false;
        }
      });

      // Keyboard: arrow keys between tabs
      tab.addEventListener('keydown', e => {
        const tabs = Array.from(pricingTabs);
        const idx = tabs.indexOf(tab);
        let next;
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
          next = tabs[(idx + 1) % tabs.length];
        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
          next = tabs[(idx - 1 + tabs.length) % tabs.length];
        }
        if (next) {
          e.preventDefault();
          next.focus();
          next.click();
        }
      });
    });
  }

  /* ── Service worker cleanup ─────── */
  // Static marketing pages should not depend on a stale service worker.
  // It was returning cached JS/CSS during navigation, which can leave the curtain
  // and old interaction code active after deployments.
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations()
      .then(registrations => registrations.forEach(registration => registration.unregister()))
      .catch(() => {});
  }
  if ('caches' in window) {
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key.startsWith('hdr-')).map(key => caches.delete(key))))
      .catch(() => {});
  }

  /* ── Native page navigation ──────────── */
  // Do not intercept links for a fade transition. Normal anchors are faster,
  // safer, and cannot get stuck under a full-screen cover.

  // ─── Device Check Wizard ─────────────────────────────────
  const dcStep1 = document.getElementById('dcStep1');
  const dcStep2 = document.getElementById('dcStep2');
  const dcStep3 = document.getElementById('dcStep3');
  const dcStep4 = document.getElementById('dcStep4');

  if (dcStep1) {
    const dcProgressBar = document.getElementById('dcProgressBar');
    const dcStepLabels = document.querySelectorAll('.dc-step');
    const dcProblems = document.getElementById('dcProblems');
    const dcResults = document.getElementById('dcResults');
    const dcNext2 = document.getElementById('dcNext2');
    const dcNext3 = document.getElementById('dcNext3');
    const dcDeviceLabel = document.getElementById('dcDeviceLabel');

    let state = { device: '', problems: [], urgency: 'no-rush', condition: 'works' };

    // Pricing database
    const repairData = {
      iphone: {
        label: 'iPhone',
        problems: [
          { id: 'screen', icon: 'broken_image', label: 'Cracked / broken screen', sub: 'Display damage', price: [39, 69], time: '45–60 min' },
          { id: 'battery', icon: 'battery_alert', label: 'Battery drains fast', sub: 'Swelling or short life', price: [35, 49], time: '30–45 min' },
          { id: 'charging', icon: 'bolt', label: 'Won\'t charge', sub: 'Port or cable issue', price: [39, 59], time: '45–60 min' },
          { id: 'water', icon: 'water_drop', label: 'Water damage', sub: 'Liquid exposure', price: [49, 89], time: '1–3 hrs' },
          { id: 'camera', icon: 'broken_image', label: 'Camera not working', sub: 'Blurry, black, or cracked', price: [45, 79], time: '45–60 min' },
          { id: 'button', icon: 'touch_app', label: 'Buttons not responding', sub: 'Home, power, or volume', price: [35, 55], time: '30–45 min' },
          { id: 'speaker', icon: 'volume_off', label: 'No sound / speaker issue', sub: 'Muffled or silent', price: [35, 55], time: '30–45 min' },
          { id: 'other', icon: 'build', label: 'Something else', sub: 'Not listed above', price: [29, 89], time: 'Varies' }
        ]
      },
      android: {
        label: 'Android Phone',
        problems: [
          { id: 'screen', icon: 'broken_image', label: 'Cracked / broken screen', sub: 'LCD or AMOLED', price: [49, 89], time: '60–90 min' },
          { id: 'battery', icon: 'battery_alert', label: 'Battery drains fast', sub: 'Swelling or short life', price: [35, 55], time: '30–45 min' },
          { id: 'charging', icon: 'bolt', label: 'Won\'t charge', sub: 'USB-C port issue', price: [35, 59], time: '45–60 min' },
          { id: 'water', icon: 'water_drop', label: 'Water damage', sub: 'Liquid exposure', price: [49, 89], time: '1–3 hrs' },
          { id: 'camera', icon: 'broken_image', label: 'Camera not working', sub: 'Blurry, black, or cracked', price: [45, 79], time: '45–60 min' },
          { id: 'software', icon: 'restart_alt', label: 'Frozen / boot loop', sub: 'Won\'t start properly', price: [29, 49], time: '30–60 min' },
          { id: 'back', icon: 'screen_rotation', label: 'Back glass cracked', sub: 'Rear panel damage', price: [35, 69], time: '45–60 min' },
          { id: 'other', icon: 'build', label: 'Something else', sub: 'Not listed above', price: [29, 89], time: 'Varies' }
        ]
      },
      laptop: {
        label: 'Laptop / PC',
        problems: [
          { id: 'screen', icon: 'broken_image', label: 'Broken / dim screen', sub: 'Cracked or no display', price: [99, 199], time: '1–2 hrs' },
          { id: 'battery', icon: 'battery_alert', label: 'Battery won\'t hold charge', sub: 'Short life or swelling', price: [69, 99], time: '30–60 min' },
          { id: 'keyboard', icon: 'keyboard', label: 'Keyboard issues', sub: 'Sticky or dead keys', price: [79, 129], time: '1–2 hrs' },
          { id: 'slow', icon: 'speed', label: 'Running slow', sub: 'SSD/RAM upgrade', price: [49, 99], time: '1–2 hrs' },
          { id: 'virus', icon: 'warning', label: 'Virus / malware', sub: 'Popups, slowdown', price: [39, 59], time: '1–2 hrs' },
          { id: 'noboot', icon: 'restart_alt', label: 'Won\'t turn on', sub: 'Dead or boot failure', price: [49, 129], time: '1–3 hrs' },
          { id: 'water', icon: 'water_drop', label: 'Liquid spill', sub: 'Keyboard or internal', price: [79, 149], time: '2–4 hrs' },
          { id: 'other', icon: 'build', label: 'Something else', sub: 'Not listed above', price: [49, 149], time: 'Varies' }
        ]
      },
      tablet: {
        label: 'iPad / Tablet',
        problems: [
          { id: 'screen', icon: 'broken_image', label: 'Cracked screen', sub: 'Glass or LCD', price: [59, 129], time: '60–90 min' },
          { id: 'battery', icon: 'battery_alert', label: 'Battery drains fast', sub: 'Short life', price: [49, 79], time: '45–60 min' },
          { id: 'charging', icon: 'bolt', label: 'Won\'t charge', sub: 'Port issue', price: [39, 69], time: '45–60 min' },
          { id: 'button', icon: 'touch_app', label: 'Button not working', sub: 'Home or power', price: [35, 59], time: '30–45 min' },
          { id: 'water', icon: 'water_drop', label: 'Water damage', sub: 'Liquid exposure', price: [49, 89], time: '1–3 hrs' },
          { id: 'other', icon: 'build', label: 'Something else', sub: 'Not listed above', price: [39, 99], time: 'Varies' }
        ]
      },
      console: {
        label: 'Game Console',
        problems: [
          { id: 'disc', icon: 'broken_image', label: 'Disc read errors', sub: 'Won\'t read games', price: [49, 89], time: '1–2 hrs' },
          { id: 'hdmi', icon: 'monitor', label: 'No video output', sub: 'HDMI port issue', price: [59, 99], time: '1–2 hrs' },
          { id: 'overheat', icon: 'warning', label: 'Overheating', sub: 'Thermal paste / fan', price: [39, 69], time: '1–2 hrs' },
          { id: 'drift', icon: 'touch_app', label: 'Controller drift', sub: 'Joy-Con or thumbstick', price: [25, 45], time: '30–45 min' },
          { id: 'nopower', icon: 'restart_alt', label: 'Won\'t turn on', sub: 'Power supply issue', price: [49, 89], time: '1–2 hrs' },
          { id: 'other', icon: 'build', label: 'Something else', sub: 'Not listed above', price: [39, 99], time: 'Varies' }
        ]
      },
      other: {
        label: 'Other Device',
        problems: [
          { id: 'screen', icon: 'broken_image', label: 'Screen / display issue', sub: 'Cracked or dead', price: [39, 129], time: 'Varies' },
          { id: 'battery', icon: 'battery_alert', label: 'Battery issue', sub: 'Won\'t hold charge', price: [29, 79], time: 'Varies' },
          { id: 'nopower', icon: 'restart_alt', label: 'Won\'t turn on', sub: 'Dead device', price: [29, 89], time: 'Varies' },
          { id: 'other', icon: 'build', label: 'Something else', sub: 'Not listed above', price: [29, 99], time: 'Varies' }
        ]
      }
    };

    function setStep(step) {
      [dcStep1, dcStep2, dcStep3, dcStep4].forEach((p, i) => {
        p.classList.toggle('active', i + 1 === step);
      });
      dcProgressBar.style.width = (step * 25) + '%';
      dcStepLabels.forEach((el, i) => {
        el.classList.toggle('active', i + 1 === step);
        el.classList.toggle('done', i + 1 < step);
      });
      // Scroll to wizard top
      const wizard = document.getElementById('device-check');
      if (wizard) wizard.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    // Step 1: Device selection
    dcStep1.querySelectorAll('.dc-option').forEach(btn => {
      btn.addEventListener('click', () => {
        state.device = btn.dataset.device;
        state.problems = [];
        populateProblems();
        setStep(2);
      });
    });

    // Populate step 2 problems
    function populateProblems() {
      const data = repairData[state.device];
      dcDeviceLabel.textContent = 'Select all that apply for your ' + data.label;
      dcProblems.innerHTML = '';
      data.problems.forEach(p => {
        const btn = document.createElement('button');
        btn.className = 'dc-option';
        btn.dataset.problem = p.id;
        btn.innerHTML = `
          <span class="material-symbols-outlined" data-icon="${p.icon}" aria-hidden="true"></span>
          <span class="dc-option-text">
            <strong>${p.label}</strong>
            <span class="dc-option-sub">${p.sub}</span>
          </span>
          <span class="dc-check"><span class="material-symbols-outlined" data-icon="check" aria-hidden="true"></span></span>
        `;
        btn.addEventListener('click', () => {
          btn.classList.toggle('selected');
          const pid = btn.dataset.problem;
          if (state.problems.includes(pid)) {
            state.problems = state.problems.filter(x => x !== pid);
          } else {
            state.problems.push(pid);
          }
          dcNext2.disabled = state.problems.length === 0;
        });
        dcProblems.appendChild(btn);
      });
      dcNext2.disabled = true;
    }

    // Step 2 next
    dcNext2.addEventListener('click', () => {
      if (state.problems.length === 0) return;
      setStep(3);
    });

    // Step 3 next — generate results
    dcNext3.addEventListener('click', () => {
      state.urgency = document.querySelector('input[name="urgency"]:checked')?.value || 'no-rush';
      state.condition = document.querySelector('input[name="condition"]:checked')?.value || 'works';
      generateResults();
      setStep(4);
    });

    // Back buttons
    document.getElementById('dcBack2')?.addEventListener('click', () => setStep(1));
    document.getElementById('dcBack3')?.addEventListener('click', () => setStep(2));
    document.getElementById('dcBack4')?.addEventListener('click', () => {
      state = { device: '', problems: [], urgency: 'no-rush', condition: 'works' };
      setStep(1);
    });

    function generateResults() {
      const data = repairData[state.device];
      const selected = data.problems.filter(p => state.problems.includes(p.id));

      let totalLow = 0;
      let totalHigh = 0;

      let rowsHTML = '';
      selected.forEach(p => {
        totalLow += p.price[0];
        totalHigh += p.price[1];
        rowsHTML += `
          <div class="dc-estimate-row">
            <span class="dc-estimate-label">
              <span class="material-symbols-outlined" data-icon="${p.icon}" aria-hidden="true"></span>
              ${p.label}
            </span>
            <span class="dc-estimate-value">$${p.price[0]}–$${p.price[1]}</span>
          </div>`;
      });

      // Time estimate
      let timeStr = selected.length === 1 ? selected[0].time : 'Varies by repair';
      if (selected.length > 1 && selected.length <= 3) timeStr = '1–3 hours (combined)';
      if (selected.length > 3) timeStr = '2–4 hours (combined)';

      // Urgency badge
      const urgLabels = { 'no-rush': ['No rush', 'no-rush'], 'soon': ['Within 1–2 days', 'soon'], 'asap': ['ASAP — priority', 'asap'] };
      const [urgText, urgClass] = urgLabels[state.urgency];

      // Condition note
      const condNotes = {
        works: 'Since your device still works, this is likely a straightforward repair.',
        partial: 'Partially working devices usually have a good prognosis — I\'ll confirm once I see it.',
        dead: 'Devices that won\'t turn on need diagnosis first. The estimate above covers the most likely fix — I\'ll confirm the exact cost before starting.'
      };

      // SMS body
      const smsIssues = selected.map(p => p.label.toLowerCase()).join(', ');
      const smsBody = encodeURIComponent(`Hi, I used the Device Check tool. I have a ${data.label} with: ${smsIssues}. Urgency: ${urgText.toLowerCase()}. Can you help?`);

      dcResults.innerHTML = `
        <div class="dc-results-header">
          <span class="material-symbols-outlined" data-icon="check_circle" aria-hidden="true"></span>
          <h2>Here's your estimate</h2>
          <p>${data.label} — ${selected.length} repair${selected.length > 1 ? 's' : ''}</p>
          <span class="dc-urgency-badge dc-urgency-badge--${urgClass}">
            <span class="material-symbols-outlined" data-icon="schedule" aria-hidden="true"></span> ${urgText}
          </span>
        </div>

        <div class="dc-estimate-card">
          <div class="dc-estimate-card-header">
            <span class="material-symbols-outlined" data-icon="description" aria-hidden="true"></span>
            Repair Breakdown
          </div>
          <div class="dc-estimate-rows">
            ${rowsHTML}
            <div class="dc-estimate-row">
              <span class="dc-estimate-label">
                <span class="material-symbols-outlined" data-icon="timer" aria-hidden="true"></span>
                Estimated time
              </span>
              <span class="dc-estimate-time">${timeStr}</span>
            </div>
          </div>
          <div class="dc-estimate-card-footer">
            <span>Estimated total</span>
            <span style="color: var(--accent);">$${totalLow}${totalHigh > totalLow ? '–$' + totalHigh : ''}</span>
          </div>
        </div>

        <p class="dc-results-note">
          ${condNotes[state.condition]}<br />
          This is an estimate based on common repairs. Final pricing confirmed after free in-person diagnosis. All repairs include a <strong>90-day warranty</strong>.
        </p>

        <div class="dc-results-cta">
          <a href="sms:+12084501606?body=${smsBody}" class="btn btn-primary">
            <span class="material-symbols-outlined" data-icon="sms" aria-hidden="true"></span> Text This Estimate to Samuel
          </a>
          <a href="/contact" class="btn btn-outline">
            <span class="material-symbols-outlined" data-icon="description" aria-hidden="true"></span> Request Full Quote
          </a>
        </div>
      `;
    }
  }

  // ─── Floating Help Widget ─────────────────────────────────
  const helpFab = document.getElementById('helpFab');
  const helpTrigger = document.getElementById('helpFabTrigger');

  if (helpFab && helpTrigger) {
    // Check if dismissed this session
    if (sessionStorage.getItem('hdr_help_dismissed') === '1') {
      helpFab.classList.add('dismissed');
    }

    helpTrigger.addEventListener('click', () => {
      if (helpFab.classList.contains('open')) {
        helpFab.classList.remove('open');
      } else {
        helpFab.classList.add('open');
      }
    });

    // Close when clicking outside
    document.addEventListener('click', (e) => {
      if (helpFab.classList.contains('open') && !helpFab.contains(e.target)) {
        helpFab.classList.remove('open');
      }
    });

    // Close on Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && helpFab.classList.contains('open')) {
        helpFab.classList.remove('open');
        helpTrigger.focus();
      }
    });

    // Hide after clicking a contact option (they navigated)
    helpFab.querySelectorAll('.help-fab-option').forEach(opt => {
      opt.addEventListener('click', () => {
        helpFab.classList.remove('open');
      });
    });

    // Don't show immediately — wait for scroll to indicate engagement
    helpFab.style.opacity = '0';
    helpFab.style.transform = 'translateY(16px)';
    helpFab.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
    let helpShown = false;
    const showHelp = () => {
      if (!helpShown && window.scrollY > 300) {
        helpShown = true;
        helpFab.style.opacity = '1';
        helpFab.style.transform = 'translateY(0)';
        window.removeEventListener('scroll', showHelp);
      }
    };
    window.addEventListener('scroll', showHelp, { passive: true });
    // Also show after 8 seconds if user hasn't scrolled
    setTimeout(() => {
      if (!helpShown) {
        helpShown = true;
        helpFab.style.opacity = '1';
        helpFab.style.transform = 'translateY(0)';
      }
    }, 8000);
  }

})();

// ─── FAQ Hub: Search + Category Filters ───────────────────
(function() {
  const search = document.getElementById('faqSearch');
  const count  = document.getElementById('faqSearchCount');
  const filters = document.getElementById('faqFilters');
  const noResults = document.getElementById('faqNoResults');
  if (!search || !filters) return;

  const items = Array.from(document.querySelectorAll('.faq-hub-item'));
  const categories = Array.from(document.querySelectorAll('.faq-hub-category'));
  let activeCategory = 'all';

  function applyFilters() {
    const query = search.value.toLowerCase().trim();
    let visible = 0;

    items.forEach(item => {
      const cat = item.getAttribute('data-category');
      const text = item.textContent.toLowerCase();
      const matchesCat = activeCategory === 'all' || cat === activeCategory;
      const matchesSearch = !query || text.includes(query);
      const show = matchesCat && matchesSearch;
      item.hidden = !show;
      if (show) visible++;
    });

    // Show/hide category headings
    categories.forEach(catDiv => {
      const cat = catDiv.getAttribute('data-cat');
      const matchesCat = activeCategory === 'all' || cat === activeCategory;
      const hasVisible = Array.from(catDiv.querySelectorAll('.faq-hub-item')).some(i => !i.hidden);
      catDiv.hidden = !matchesCat || !hasVisible;
    });

    // Update count
    if (query) {
      count.textContent = visible + ' found';
    } else {
      count.textContent = '';
    }

    // No results
    if (noResults) {
      noResults.hidden = visible > 0;
    }
  }

  // Search input
  search.addEventListener('input', applyFilters);

  // Category filter buttons
  filters.addEventListener('click', function(e) {
    const btn = e.target.closest('.faq-hub-filter');
    if (!btn) return;
    activeCategory = btn.getAttribute('data-category');
    filters.querySelectorAll('.faq-hub-filter').forEach(b => {
      b.classList.toggle('active', b === btn);
      b.setAttribute('aria-selected', b === btn ? 'true' : 'false');
    });
    applyFilters();
  });

  // Keyboard: arrows between filters
  filters.addEventListener('keydown', function(e) {
    const btns = Array.from(filters.querySelectorAll('.faq-hub-filter'));
    const idx = btns.indexOf(document.activeElement);
    if (idx < 0) return;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      btns[(idx + 1) % btns.length].focus();
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      btns[(idx - 1 + btns.length) % btns.length].focus();
    }
  });
})();

/* ═══════════════════════════════════════════════
   MAGNETIC BUTTONS — Cursor-pull effect
   Buttons pull toward cursor within a proximity radius.
═══════════════════════════════════════════════ */
(function() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var hasPointer = window.matchMedia('(pointer: fine)').matches || window.matchMedia('(hover: hover)').matches;
  if (!hasPointer) return;

  var MAGNETIC_RADIUS = 80;
  var MAGNETIC_STRENGTH = 0.35;
  var buttons = document.querySelectorAll('[data-magnetic]');

  buttons.forEach(function(btn) {
    if (!btn.querySelector('.btn-magnetic-inner')) {
      var inner = document.createElement('span');
      inner.className = 'btn-magnetic-inner';
      while (btn.firstChild) inner.appendChild(btn.firstChild);
      btn.appendChild(inner);
    }

    var rafId = null;

    function handleMove(e) {
      if (rafId) return;
      rafId = requestAnimationFrame(function() {
        rafId = null;
        var rect = btn.getBoundingClientRect();
        var cx = rect.left + rect.width / 2;
        var cy = rect.top + rect.height / 2;
        var dx = e.clientX - cx;
        var dy = e.clientY - cy;
        var dist = Math.sqrt(dx * dx + dy * dy);
        var radius = Math.max(rect.width, rect.height) / 2 + MAGNETIC_RADIUS;

        if (dist < radius) {
          var pull = 1 - (dist / radius);
          var moveX = dx * pull * MAGNETIC_STRENGTH;
          var moveY = dy * pull * MAGNETIC_STRENGTH;
          btn.style.transform = 'translate(' + moveX.toFixed(1) + 'px, ' + moveY.toFixed(1) + 'px)';
          var innerEl = btn.querySelector('.btn-magnetic-inner');
          if (innerEl) {
            innerEl.style.transform = 'translate(' + (moveX * 0.3).toFixed(1) + 'px, ' + (moveY * 0.3).toFixed(1) + 'px)';
          }
          btn.classList.add('is-magnetic');
        } else {
          release();
        }
      });
    }

    function release() {
      btn.style.transform = '';
      var innerEl = btn.querySelector('.btn-magnetic-inner');
      if (innerEl) innerEl.style.transform = '';
      btn.classList.remove('is-magnetic');
    }

    document.addEventListener('mousemove', handleMove, { passive: true });
    btn.addEventListener('mouseleave', release);
  });
})();


/* ═══════════════════════════════════════════════
   MAGNETIC NAV LINKS
   Subtle magnetic pull effect on navigation links.
═══════════════════════════════════════════════ */
(function() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var hasPointer = window.matchMedia('(pointer: fine)').matches || window.matchMedia('(hover: hover)').matches;
  if (!hasPointer) return;

  var links = document.querySelectorAll('.nav-links .nav-link');
  if (!links.length) return;

  var RADIUS = 50;
  var STRENGTH = 0.2;

  links.forEach(function(link) {
    var rafId = null;

    function handleMove(e) {
      if (rafId) return;
      rafId = requestAnimationFrame(function() {
        rafId = null;
        var rect = link.getBoundingClientRect();
        var cx = rect.left + rect.width / 2;
        var cy = rect.top + rect.height / 2;
        var dx = e.clientX - cx;
        var dy = e.clientY - cy;
        var dist = Math.sqrt(dx * dx + dy * dy);
        var triggerRadius = Math.max(rect.width, rect.height) / 2 + RADIUS;

        if (dist < triggerRadius) {
          var pull = 1 - (dist / triggerRadius);
          var moveX = dx * pull * STRENGTH;
          var moveY = dy * pull * STRENGTH;
          link.style.transform = 'translate(' + moveX.toFixed(1) + 'px, ' + moveY.toFixed(1) + 'px)';
        } else {
          link.style.transform = '';
        }
      });
    }

    function release() {
      link.style.transform = '';
    }

    link.addEventListener('mouseenter', function() {
      document.addEventListener('mousemove', handleMove, { passive: true });
    });
    link.addEventListener('mouseleave', function() {
      document.removeEventListener('mousemove', handleMove);
      release();
    });
  });
})();


/* ═══════════════════════════════════════════════
   SERVICE AREA MAP — Self-Building Animation
   Adds 'visible' class when map scrolls into view.
═══════════════════════════════════════════════ */
(function() {
  var areaMap = document.querySelector('.area-map');
  if (!areaMap) return;

  if ('IntersectionObserver' in window) {
    var observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
    observer.observe(areaMap);
  } else {
    areaMap.classList.add('visible');
  }
})();


/* ═══════════════════════════════════════════════
   FAQ ACCORDION — Smooth height animation
   Intercepts native <details> toggle to add
   smooth open/close height transitions, keyboard
   navigation, and staggered scroll-in indices.
═══════════════════════════════════════════════ */
(function() {
  var faqItems = document.querySelectorAll('.faq-list .faq-item');
  if (!faqItems.length) return;

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var ANIMATION_DURATION = reduceMotion ? 0 : 300;

  // Set stagger index CSS custom property for scroll-in
  faqItems.forEach(function(item, i) {
    item.style.setProperty('--faq-idx', i);
  });

  // Wrap each answer's content for padding management
  faqItems.forEach(function(item) {
    var answer = item.querySelector('.faq-answer');
    if (!answer || answer.classList.contains('faq-answer--managed')) return;

    var inner = document.createElement('div');
    inner.className = 'faq-answer-inner';
    while (answer.firstChild) {
      inner.appendChild(answer.firstChild);
    }
    answer.appendChild(inner);
    answer.classList.add('faq-answer--managed');
  });

  if (reduceMotion) return;

  // Smooth toggle handler
  faqItems.forEach(function(item) {
    var summary = item.querySelector('summary');
    var answer = item.querySelector('.faq-answer');
    if (!summary || !answer) return;

    var isAnimating = false;

    summary.addEventListener('click', function(e) {
      e.preventDefault();
      if (isAnimating) return;

      if (item.hasAttribute('open')) {
        closeItem(item, answer);
      } else {
        openItem(item, answer);
      }
    });

    function openItem(detailsEl, answerEl) {
      isAnimating = true;

      var chevron = detailsEl.querySelector('.faq-chevron');
      if (chevron) {
        chevron.classList.remove('arrow-bounce-close');
        chevron.classList.add('arrow-bounce-open');
      }

      detailsEl.setAttribute('open', '');

      var targetHeight = answerEl.scrollHeight;

      answerEl.style.height = '0px';
      answerEl.style.opacity = '0';
      answerEl.style.overflow = 'hidden';
      answerEl.style.transition = 'height ' + ANIMATION_DURATION + 'ms cubic-bezier(0.34, 1.12, 0.64, 1), opacity ' + Math.round(ANIMATION_DURATION * 0.7) + 'ms ease';

      answerEl.offsetHeight; // force reflow

      answerEl.style.height = targetHeight + 'px';
      answerEl.style.opacity = '1';

      var inner = answerEl.querySelector('.faq-answer-inner');
      if (inner) {
        setTimeout(function() {
          inner.classList.add('reading-lit');
        }, 150);
      }

      setTimeout(function() {
        answerEl.style.height = '';
        answerEl.style.overflow = '';
        answerEl.style.transition = '';
        answerEl.style.opacity = '';
        isAnimating = false;
      }, ANIMATION_DURATION + 50);
    }

    function closeItem(detailsEl, answerEl) {
      isAnimating = true;

      var chevron = detailsEl.querySelector('.faq-chevron');
      if (chevron) {
        chevron.classList.remove('arrow-bounce-open');
        chevron.classList.add('arrow-bounce-close');
      }

      var currentHeight = answerEl.scrollHeight;
      answerEl.style.height = currentHeight + 'px';
      answerEl.style.overflow = 'hidden';
      answerEl.style.transition = 'height ' + ANIMATION_DURATION + 'ms cubic-bezier(0.34, 0, 0.64, 1), opacity ' + Math.round(ANIMATION_DURATION * 0.5) + 'ms ease';

      answerEl.offsetHeight; // force reflow

      answerEl.style.height = '0px';
      answerEl.style.opacity = '0';

      var inner = answerEl.querySelector('.faq-answer-inner');
      if (inner) {
        inner.classList.remove('reading-lit');
      }

      setTimeout(function() {
        detailsEl.removeAttribute('open');
        answerEl.style.height = '';
        answerEl.style.overflow = '';
        answerEl.style.transition = '';
        answerEl.style.opacity = '';
        isAnimating = false;
      }, ANIMATION_DURATION + 50);
    }
  });
})();


/* ── Text luminance reveal — scroll-linked gradient text wipe ────────── */
  /* Velocity-aware: faster scrolling boosts reveal progress ahead of normal position */
  (function() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var reveals = document.querySelectorAll('[data-text-reveal]');
    if (!reveals.length) return;

    // Velocity tracking
    var lastScrollY = window.scrollY;
    var lastTime = performance.now();
    var velocityBoost = 0; // 0-15% bonus based on scroll speed

    function updateReveal() {
      var vh = window.innerHeight;

      // Calculate scroll velocity
      var now = performance.now();
      var dt = now - lastTime;
      if (dt > 0) {
        var dy = Math.abs(window.scrollY - lastScrollY);
        var velocity = dy / dt; // px/ms
        // Map velocity to boost: 0-4 px/ms → 0-15% bonus
        velocityBoost = Math.min(15, velocity * 3.75);
        // Decay boost gradually when scrolling slow
        if (velocity < 0.5) {
          velocityBoost *= 0.8;
        }
      }
      lastScrollY = window.scrollY;
      lastTime = now;

      reveals.forEach(function(el) {
        if (el.classList.contains('text-revealed')) return;
        var rect = el.getBoundingClientRect();
        // Start revealing when element enters viewport, complete when center of element reaches 40% from top
        var start = vh * 0.85;   // element entering bottom 85% of viewport
        var end = vh * 0.25;     // element well into view (top 25%)
        var current = rect.top + rect.height / 2;
        var progress;
        if (current >= start) {
          progress = 0;
        } else if (current <= end) {
          progress = 100;
        } else {
          progress = ((start - current) / (start - end)) * 100;
        }
        // Add velocity boost — fast scrolling reveals text ahead
        var boostedProgress = Math.min(100, progress + velocityBoost);
        // Apply easeOutCubic for a natural deceleration at the end
        var t = boostedProgress / 100;
        var eased = 1 - Math.pow(1 - t, 3);
        var easedProgress = eased * 100;
        el.style.setProperty('--reveal-progress', easedProgress.toFixed(1));
        // Lock when fully revealed to remove gradient overhead
        if (boostedProgress >= 100) {
          el.classList.add('text-revealed');
          el.style.removeProperty('--reveal-progress');
        }
      });
    }

    var ticking = false;
    function onScroll() {
      if (!ticking) {
        requestAnimationFrame(function() {
          updateReveal();
          ticking = false;
        });
        ticking = true;
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    // Initial check (elements might already be in view)
    updateReveal();
  })();

// Hero status clock
(function() {
  function updateStatus() {
    const now = new Date();
    const mtOffset = -7; // Mountain Time
    const mtTime = new Date(now.getTime() + (mtOffset - now.getTimezoneOffset()/60) * 3600000);
    const day = mtTime.getUTCDay();
    const hour = mtTime.getUTCHours() - 7;
    const min = mtTime.getUTCMinutes();
    const totalMin = hour * 60 + min;
    let open = false;
    let closingSoon = false;
    // Mon-Fri 9am-9pm, Weekends 11am-7pm
    if (day >= 1 && day <= 5 && totalMin >= 540 && totalMin < 1260) {
      open = true;
      if (totalMin >= 1230) closingSoon = true;
    } else if ((day === 0 || day === 6) && totalMin >= 660 && totalMin < 1140) {
      open = true;
      if (totalMin >= 1110) closingSoon = true;
    }
    const dot = document.getElementById('statusDot');
    const text = document.getElementById('statusText');
    const time = document.getElementById('statusTime');
    if (dot && text && time) {
      dot.className = 'status-dot' + (open ? (closingSoon ? ' closing-soon' : '') : ' closed');
      text.textContent = open ? (closingSoon ? 'Closing soon' : 'Open now') : 'Currently closed';
      time.textContent = mtTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'America/Boise' });
    }
  }
  updateStatus();
  setInterval(updateStatus, 60000);
})();

// ─── Float Labels: Select handling ────────────────────────
// Selects don't support :placeholder-shown, so we toggle a class
(function() {
  document.querySelectorAll('.form-group select').forEach(function(sel) {
    function update() {
      if (sel.value) {
        sel.classList.add('has-value');
      } else {
        sel.classList.remove('has-value');
      }
    }
    sel.addEventListener('change', update);
    update(); // Initial state
  });
})();

// ─── Timeline scroll-fill animation ──────────────────────
(function() {
  var timeline = document.getElementById('processTimeline');
  var fill = document.getElementById('timelineFill');
  var glow = document.getElementById('timelineGlow');
  if (!timeline || !fill) return;

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function updateFill() {
    var rect = timeline.getBoundingClientRect();
    var viewH = window.innerHeight;

    // Calculate how far through the timeline the viewport center is
    var timelineTop = rect.top;
    var timelineH = rect.height;

    if (timelineTop > viewH) {
      fill.style.height = '0%';
      if (glow) { glow.classList.remove('active'); }
      return;
    }
    if (timelineTop + timelineH < 0) {
      fill.style.height = '100%';
      if (glow) { glow.classList.remove('active'); }
      return;
    }

    // Progress: 0 when section top hits viewport bottom, 1 when section bottom hits viewport top
    var scrolled = viewH - timelineTop;
    var total = viewH + timelineH;
    var pct = Math.max(0, Math.min(100, (scrolled / total) * 125));

    fill.style.height = (reduceMotion ? 100 : pct) + '%';

    // Position the glow dot at the fill's leading edge
    if (glow && !reduceMotion && pct > 0 && pct < 100) {
      glow.classList.add('active');
      glow.style.top = pct + '%';
    } else if (glow) {
      glow.classList.remove('active');
    }
  }

  if (!reduceMotion) {
    var ticking = false;
    window.addEventListener('scroll', function() {
      if (!ticking) {
        requestAnimationFrame(function() { updateFill(); ticking = false; });
        ticking = true;
      }
    }, { passive: true });
  }
  updateFill();
})();

/* ── Services Cards: Mobile Horizontal Scroll + Dots ── */
(function() {
  var grid = document.getElementById('servicesCardsGrid');
  var dotsContainer = document.getElementById('cardsScrollIndicators');
  if (!grid || !dotsContainer) return;

  var cards = grid.querySelectorAll('.card');
  var dotCount = cards.length;

  // Only activate on mobile
  var mq = window.matchMedia('(max-width: 768px)');

  function buildDots() {
    dotsContainer.innerHTML = '';
    if (!mq.matches) return;
    cards.forEach(function(_, i) {
      var dot = document.createElement('button');
      dot.className = 'cards-scroll-dot' + (i === 0 ? ' active' : '');
      dot.setAttribute('aria-label', 'Go to card ' + (i + 1));
      dot.dataset.index = i;
      dot.addEventListener('click', function() {
        var targetScrollLeft = cards[i].offsetLeft - grid.offsetLeft - 16;
        grid.scrollTo({ left: targetScrollLeft, behavior: 'smooth' });
      });
      dotsContainer.appendChild(dot);
    });
  }

  function updateActiveDot() {
    if (!mq.matches) return;
    var scrollLeft = grid.scrollLeft;
    var cardWidth = cards[0].offsetWidth + 16; // including gap
    var activeIndex = Math.round(scrollLeft / cardWidth);
    activeIndex = Math.max(0, Math.min(activeIndex, dotCount - 1));
    dotsContainer.querySelectorAll('.cards-scroll-dot').forEach(function(dot, i) {
      dot.classList.toggle('active', i === activeIndex);
    });
  }

  buildDots();

  // Update dots on scroll
  grid.addEventListener('scroll', function() {
    updateActiveDot();
  }, { passive: true });

  // Rebuild dots on resize (orientation change, etc.)
  window.addEventListener('resize', function() {
    buildDots();
    updateActiveDot();
  });
})();

// Hero open/closed status clock
(function() {
  var clockEl = document.getElementById('heroClock');
  var dotEl = document.getElementById('heroStatusDot');
  if (!clockEl || !dotEl) return;

  var HAILEY_TZ = 'America/Boise'; // Mountain Time

  function isOpen() {
    var now = new Date();
    var timeStr = now.toLocaleTimeString('en-US', { timeZone: HAILEY_TZ });
    var [time, period] = timeStr.split(' ');
    var [hours, minutes] = time.split(':').map(Number);
    if (period === 'PM' && hours !== 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;

    var dayStr = now.toLocaleDateString('en-US', { timeZone: HAILEY_TZ, weekday: 'short' });
    var dayNum = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].indexOf(dayStr);

    // Mon-Fri 9am-9pm, Weekends 11am-7pm
    var isOpen = false;
    var closingSoon = false;
    if (dayNum >= 1 && dayNum <= 5) { isOpen = hours >= 9 && hours < 21; closingSoon = hours === 20 && minutes >= 30; }
    else if (dayNum === 0 || dayNum === 6) { isOpen = hours >= 11 && hours < 19; closingSoon = hours === 18 && minutes >= 30; }
    return { open: isOpen, closingSoon: closingSoon };
  }

  function updateClock() {
    var now = new Date();
    var timeStr = now.toLocaleTimeString('en-US', {
      timeZone: HAILEY_TZ,
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
    var { open, closingSoon } = isOpen();

    clockEl.textContent = closingSoon ? 'Closing soon' : (open ? 'Open now' : 'Closed now');

    dotEl.classList.remove('closed', 'closing-soon');
    if (!open) {
      dotEl.classList.add('closed');
    } else if (closingSoon) {
      dotEl.classList.add('closing-soon');
    }
  }

  updateClock();
  setInterval(updateClock, 60000);
})();

/* ═══════════════════════════════════════════
   REPAIR SOS — Interactive Emergency Guides
══════════════════════════════════════════ */
(function() {
  'use strict';

  const SOS_DATA = {
    water: {
      title: 'Water Damage',
      urgency: 'CRITICAL — Every minute counts',
      icon: `<svg viewBox="0 0 48 48" fill="none" width="32" height="32">
        <path d="M24 6 C24 6 10 22 10 31 C10 38.7 16.3 45 24 45 C31.7 45 38 38.7 38 31 C38 22 24 6 24 6Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M24 18 C24 18 16 28 16 33 C16 37 19.6 40 24 40 C28.4 40 32 37 32 33 C32 28 24 18 24 18Z" fill="currentColor" opacity="0.25"/>
      </svg>`,
      steps: [
        {
          title: 'Get it out and keep it off',
          desc: 'The longer it stays wet, the worse the damage. If the screen is still on, <strong>power it down immediately</strong>.',
          timer: 'Immediately'
        },
        {
          title: 'Do not charge it and do not test it',
          desc: 'Charging a wet phone is one of the fastest ways to short it out. Resist the urge to “just see if it still works.”',
          timer: 'Right now'
        },
        {
          title: 'Wipe the outside only',
          desc: 'Use a soft cloth or paper towel. <strong>Do not shake it</strong> — that can push water deeper into the phone.',
          timer: '30 seconds'
        },
        {
          title: 'Skip the rice and skip the heat',
          desc: 'Rice does not fix corrosion. Hair dryers, ovens, dashboard heat, or direct sunlight usually make the situation worse.',
          timer: 'Do not waste time here'
        },
        {
          title: 'Text me a photo and the model',
          desc: 'Water damage is time-sensitive. The sooner I can start drying, cleaning, and checking corrosion, the better the odds of saving the phone.',
          timer: 'Text: (208) 450-1606'
        }
      ]
    },
    cracked: {
      title: 'Cracked Screen',
      urgency: 'High — usually fixable same day',
      icon: `<svg viewBox="0 0 48 48" fill="none" width="32" height="32">
        <rect x="10" y="6" width="28" height="36" rx="4" stroke="currentColor" stroke-width="2"/>
        <path d="M16 14 L22 22 L18 30 L26 36" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
        <path d="M30 12 L34 18 L28 24" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
      </svg>`,
      steps: [
        {
          title: 'Stop pressing on the broken area',
          desc: 'Cracked glass gets worse with pressure. If pieces are lifting, keep fingers away from the edges so you do not cut yourself.',
          timer: 'Before anything else'
        },
        {
          title: 'Cover it if you need to keep using it',
          desc: 'A screen protector or even clear tape can keep loose glass from shedding while you back up or text for help.',
          timer: '1 minute'
        },
        {
          title: 'Back up if the phone still works',
          desc: 'If touch is still responding, now is the time to back up photos, messages, and notes before the display gets worse.',
          timer: '2–5 minutes'
        },
        {
          title: 'Skip DIY liquid-glass kits',
          desc: 'Most crack-repair kits do not fix real drop damage and can make a professional screen replacement messier.',
          timer: 'Save yourself the frustration'
        },
        {
          title: 'Text me a photo and your model',
          desc: 'Front photo + device model lets me tell you the likely repair and whether it looks like glass-only damage or full display damage.',
          timer: 'Text: (208) 450-1606'
        }
      ]
    },
    dead: {
      title: 'Won’t Charge / Dead Battery',
      urgency: 'Medium — often a straightforward fix',
      icon: `<svg viewBox="0 0 48 48" fill="none" width="32" height="32">
        <rect x="8" y="12" width="28" height="24" rx="3" stroke="currentColor" stroke-width="2"/>
        <path d="M36 20 L36 28 L40 28 L40 20 Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
        <rect x="10" y="14" width="8" height="20" rx="1" fill="currentColor" opacity="0.25"/>
        <path d="M20 22 L28 30 M28 22 L20 30" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>`,
      steps: [
        {
          title: 'Try a known-good cable and brick',
          desc: 'Cables and cheap charging bricks fail constantly. Use a charger you know works on another device before blaming the phone.',
          timer: '30 seconds'
        },
        {
          title: 'Check the charging port for lint',
          desc: 'Pocket lint is one of the biggest reasons a phone “won’t charge.” Use a dry toothpick or soft brush only — no metal tools.',
          timer: '1 minute'
        },
        {
          title: 'Try a force restart once',
          desc: 'Some phones look dead but are actually frozen. One force restart is worth trying before you assume it needs a battery.',
          timer: '20 seconds'
        },
        {
          title: 'If it supports wireless charging, test that',
          desc: 'If wireless charging works but the cable does not, that is a strong clue the charging port is the issue instead of the whole phone.',
          timer: '2 minutes'
        },
        {
          title: 'Text the model and what happens on charge',
          desc: 'Tell me if you get no icon, intermittent charging, cable wiggle, heat, vibration, or only wireless power. That narrows it down fast.',
          timer: 'Text: (208) 450-1606'
        }
      ]
    },
    overheat: {
      title: 'Overheating Device',
      urgency: 'Medium to high — do not ignore it',
      icon: `<svg viewBox="0 0 48 48" fill="none" width="32" height="32">
        <path d="M24 6 L24 12 M24 36 L24 42 M6 24 L12 24 M36 24 L42 24" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        <path d="M10.1 10.1 L14.5 14.5 M33.5 33.5 L37.9 37.9 M37.9 10.1 L33.5 14.5 M14.5 33.5 L10.1 37.9" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        <circle cx="24" cy="24" r="8" stroke="currentColor" stroke-width="2"/>
        <path d="M24 20 L24 24" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
        <circle cx="24" cy="28" r="2" fill="currentColor"/>
      </svg>`,
      steps: [
        {
          title: 'Stop using it immediately',
          desc: 'If it is hot to the touch, closing apps is not enough. Put it down and let it rest. Continued use accelerates damage.',
          timer: 'Right now'
        },
        {
          title: 'Unplug it and remove the case',
          desc: 'Charging plus a tight case traps heat. Removing both gives the device its best chance to cool normally.',
          timer: '10 seconds'
        },
        {
          title: 'Move it to a cool, hard surface',
          desc: 'Countertop beats bed or couch. Fabric holds heat. A fan is fine. <strong>Do not use a freezer or fridge.</strong>',
          timer: '30 seconds'
        },
        {
          title: 'Watch for swelling, smell, or repeat overheating',
          desc: 'If the screen is lifting, the device smells sharp or sweet, or it heats up again quickly, treat it as urgent and stop using it.',
          timer: '10–15 minutes'
        },
        {
          title: 'Text me if it keeps happening',
          desc: 'Overheating can be a battery problem, charging issue, thermal paste issue, software loop, or board-level fault. Repeats mean it needs hands-on diagnosis.',
          timer: 'Text: (208) 450-1606'
        }
      ]
    },
    blackout: {
      title: 'Black Screen / No Display',
      urgency: 'High — the device may still be alive',
      icon: `<svg viewBox="0 0 48 48" fill="none" width="32" height="32">
        <rect x="10" y="6" width="28" height="36" rx="4" stroke="currentColor" stroke-width="2"/>
        <path d="M16 16 L32 32 M32 16 L16 32" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>`,
      steps: [
        {
          title: 'Force restart it once',
          desc: 'A soft crash can leave the phone looking dead. One force restart is worth trying before you assume the worst.',
          timer: '20 seconds'
        },
        {
          title: 'Charge it with a known-good setup for 10–15 minutes',
          desc: 'Sometimes the battery is deeply drained and the display does not wake up right away. Use a working charger, then leave it alone for a few minutes.',
          timer: '10–15 minutes'
        },
        {
          title: 'Listen and feel for signs of life',
          desc: 'Vibration, sound, charging chime, alarm, or ring means the phone may be alive even if the screen is not.',
          timer: '30 seconds'
        },
        {
          title: 'Do not keep hammering the power button',
          desc: 'Repeated forced restarts and random button combos add confusion without giving you more information. Try the basics once, then stop.',
          timer: 'After one good attempt'
        },
        {
          title: 'Text me what happened before it went dark',
          desc: 'Drop, update, heat, water, battery drain, bad charger, or random blackout — all of that helps. Most black-screen phones are not truly dead.',
          timer: 'Text: (208) 450-1606'
        }
      ]
    },
    data: {
      title: 'Lost Photos / Data Recovery',
      urgency: 'Critical if the data matters',
      icon: `<svg viewBox="0 0 48 48" fill="none" width="32" height="32">
        <path d="M12 16 C12 12 16 8 24 8 C32 8 36 12 36 16 L38 36 C38 40 34 44 24 44 C14 44 10 40 10 36 Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
        <circle cx="24" cy="26" r="6" stroke="currentColor" stroke-width="2"/>
        <path d="M24 22 L24 30 M20 26 L28 26" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>`,
      steps: [
        {
          title: 'Stop using the device',
          desc: 'If storage is failing, every extra write can overwrite recoverable data. If it is on and unstable, stop poking around.',
          timer: 'Immediately'
        },
        {
          title: 'Do not factory reset it if the data matters',
          desc: 'Resetting, reinstalling, or doing repeated recovery-mode attempts can make recovery harder or impossible if the data is not backed up.',
          timer: 'Before any restore attempts'
        },
        {
          title: 'Check cloud backups first',
          desc: 'Look at iCloud, Google Photos, Google Drive, OneDrive, or Dropbox on another device. You may already have more than you think.',
          timer: '2–5 minutes'
        },
        {
          title: 'Figure out what matters most',
          desc: 'Photos? Tax files? Business documents? Text me the highest-priority data so I know whether we are doing repair-first or recovery-first triage.',
          timer: '1 minute'
        },
        {
          title: 'Text me the device and symptoms',
          desc: 'Tell me if it clicks, loops, gets hot, shows a logo, vibrates, or does absolutely nothing. Even “it just died” is useful information here.',
          timer: 'Text: (208) 450-1606'
        }
      ]
    },
    swollen: {
      title: 'Swollen Battery / Lifting Screen',
      urgency: 'CRITICAL — stop using it now',
      icon: `<svg viewBox="0 0 48 48" fill="none" width="32" height="32">
        <rect x="8" y="12" width="28" height="24" rx="3" stroke="currentColor" stroke-width="2"/>
        <path d="M36 20 L36 28 L40 28 L40 20 Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
        <path d="M14 18 C20 14 24 14 30 18 C24 22 20 22 14 18 Z" fill="currentColor" opacity="0.25"/>
      </svg>`,
      steps: [
        {
          title: 'Stop charging it immediately',
          desc: 'Power plus heat is the last thing a swollen battery needs. Unplug it now.',
          timer: 'Immediately'
        },
        {
          title: 'Stop using it and move it somewhere safe',
          desc: 'Keep it off beds, couches, cars in the sun, and anything flammable. Hard surface is best.',
          timer: 'Right now'
        },
        {
          title: 'Do not press the screen down',
          desc: 'If the display is lifting, do not try to clamp it, tape it flat, or “seat it back down.” That can puncture the battery.',
          timer: 'Hands off the pressure point'
        },
        {
          title: 'Do not pry or puncture the battery',
          desc: 'This is not a DIY situation if the battery is already bloated. The risk is not worth it.',
          timer: 'No tools'
        },
        {
          title: 'Text me a side photo of the lift',
          desc: 'A side-angle photo usually tells me immediately whether the battery is swelling and how urgent the handoff needs to be.',
          timer: 'Text: (208) 450-1606'
        }
      ]
    },
    bootloop: {
      title: 'Stuck on Logo / Boot Loop',
      urgency: 'High — don’t wipe it yet',
      icon: `<svg viewBox="0 0 48 48" fill="none" width="32" height="32">
        <path d="M24 8 A14 14 0 1 1 10 22" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        <path d="M10 10 L10 22 L22 22" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>`,
      steps: [
        {
          title: 'Notice what happened right before it started',
          desc: 'Failed update, low storage, battery swap, drop, water, or random restart — the backstory matters a lot with boot-loop diagnosis.',
          timer: '30 seconds'
        },
        {
          title: 'Force restart it once',
          desc: 'One good restart attempt is fine. Ten in a row does not tell you anything new.',
          timer: '20 seconds'
        },
        {
          title: 'Do not factory reset it unless you know you are backed up',
          desc: 'A wipe may solve the loop but cost you photos, notes, and app data if backup is not current.',
          timer: 'Before recovery mode'
        },
        {
          title: 'Check backup status if you can',
          desc: 'If the device briefly boots or you can see it in iCloud or Google, confirm whether your data is already safe before you try anything destructive.',
          timer: '2 minutes'
        },
        {
          title: 'Text me the model and what you see',
          desc: 'Tell me whether it is stuck on the Apple logo, Samsung splash screen, spinning wheel, update bar, or repeated restart. That changes the repair path.',
          timer: 'Text: (208) 450-1606'
        }
      ]
    },
    spill: {
      title: 'Laptop Spill / Coffee Damage',
      urgency: 'CRITICAL — shut it down now',
      icon: `<svg viewBox="0 0 48 48" fill="none" width="32" height="32">
        <rect x="8" y="10" width="32" height="22" rx="2" stroke="currentColor" stroke-width="2"/>
        <path d="M4 36 H44" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        <path d="M28 6 C28 6 24 11 24 14 C24 16.8 26.2 19 29 19 C31.8 19 34 16.8 34 14 C34 11 28 6 28 6 Z" fill="currentColor" opacity="0.22"/>
      </svg>`,
      steps: [
        {
          title: 'Unplug the charger immediately',
          desc: 'If the laptop is plugged in, disconnect power first. Electricity plus liquid is the real problem.',
          timer: 'Immediately'
        },
        {
          title: 'Shut it down hard',
          desc: 'If it is on, hold the power button until it turns off. Do not keep typing or moving windows around to save work if liquid is actively inside it.',
          timer: 'Right now'
        },
        {
          title: 'Blot and tent it keyboard-down',
          desc: 'Gently blot visible liquid and position it like an upside-down V or tent so gravity helps drain it away from the board.',
          timer: '1 minute'
        },
        {
          title: 'Do not turn it back on “to test”',
          desc: 'A laptop that seems fine for an hour can still corrode internally. Testing it too soon can finish the job.',
          timer: 'Avoid the risky test boot'
        },
        {
          title: 'Text me what spilled and how much',
          desc: 'Water, coffee, soda, tea, wine, energy drink — the type of liquid matters because sticky or acidic spills need more aggressive cleanup.',
          timer: 'Text: (208) 450-1606'
        }
      ]
    },
    nosignal: {
      title: 'No Signal / HDMI / No Display Out',
      urgency: 'High — often a port or cable issue',
      icon: `<svg viewBox="0 0 48 48" fill="none" width="32" height="32">
        <rect x="8" y="10" width="32" height="22" rx="2" stroke="currentColor" stroke-width="2"/>
        <path d="M16 38 H32" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        <path d="M22 32 V38 M26 32 V38" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>`,
      steps: [
        {
          title: 'Try another cable and another display first',
          desc: 'A bad cable or TV input is more common than people think. Swap those before assuming the console, dock, or laptop is dead.',
          timer: '1 minute'
        },
        {
          title: 'Power-cycle the device once',
          desc: 'One clean reboot is reasonable for consoles, docks, and laptops. Repeated hard resets do not help after that.',
          timer: '30 seconds'
        },
        {
          title: 'Inspect the port carefully',
          desc: 'Bent pins, looseness, wobble, or obvious damage strongly suggest the HDMI or display-out port itself is the culprit. Do not force the cable in.',
          timer: '30 seconds'
        },
        {
          title: 'Note the exact model',
          desc: 'PS5, Xbox Series X, Switch OLED, Steam Deck dock, MacBook, Dell XPS — the model matters because the common failure points are different.',
          timer: '15 seconds'
        },
        {
          title: 'Text me a photo of the port or setup',
          desc: 'A close photo of the HDMI port, dock, cable fit, or “no signal” screen gives me a much better guess before you bring it in.',
          timer: 'Text: (208) 450-1606'
        }
      ]
    }
  };
  const sosOverlay = document.getElementById('sosOverlay');
  const sosPanel = document.getElementById('sosPanel');
  const sosBackdrop = document.getElementById('sosBackdrop');
  const sosClose = document.getElementById('sosClose');
  const sosSteps = document.getElementById('sosSteps');
  const sosPrev = document.getElementById('sosPrev');
  const sosNext = document.getElementById('sosNext');
  const sosProgressFill = document.getElementById('sosProgressFill');
  const sosProgressLabel = document.getElementById('sosProgressLabel');
  const sosCtaBlock = document.getElementById('sosCtaBlock');
  const sosCtaLink = document.getElementById('sosCtaLink');

  let currentSosType = null;
  let currentStep = 0;
  let totalSteps = 0;
  let stepStates = [];

  function openSos(type) {
    currentSosType = type;
    const data = SOS_DATA[type];
    if (!data) return;

    currentStep = 0;
    totalSteps = data.steps.length;
    stepStates = data.steps.map(function() { return 'pending'; });

    document.getElementById('sosOverlayIcon').innerHTML = data.icon;
    document.getElementById('sosOverlayUrgency').textContent = data.urgency;
    document.getElementById('sosOverlayTitle').textContent = data.title;
    if (sosCtaLink) {
      var sosBody = encodeURIComponent('Hi Samuel — I need SOS help with ' + data.title + '. Device: . What happened: . Current symptoms: . I am in [city/area].');
      sosCtaLink.href = 'sms:+12084501606?body=' + sosBody;
    }

    renderSosSteps();

    sosPrev.style.display = '';
    sosNext.style.display = '';
    sosPrev.disabled = true;
    sosNext.textContent = 'Next Step';
    sosNext.innerHTML = 'Next Step <span class="material-symbols-outlined" aria-hidden="true" data-icon="arrow_forward"></span>';
    sosNext.disabled = false;
    sosNext.className = 'sos-nav-btn sos-nav-btn--next btn btn-primary';

    sosOverlay.setAttribute('aria-hidden', 'false');
    sosOverlay.classList.add('visible');
    document.body.style.overflow = 'hidden';
    sosCtaBlock.classList.remove('visible', 'sos-cta-activated');
    sosCtaBlock.setAttribute('aria-hidden', 'true');
    if (sosPanel) sosPanel.scrollTop = 0;

    requestAnimationFrame(function() {
      animateStepIn(0);
    });
  }

  function closeSos() {
    sosOverlay.setAttribute('aria-hidden', 'true');
    sosOverlay.classList.remove('visible');
    document.body.style.overflow = '';
    currentSosType = null;
    currentStep = 0;
    sosCtaBlock.classList.remove('visible', 'sos-cta-activated');
    sosCtaBlock.setAttribute('aria-hidden', 'true');
  }

  function renderSosSteps() {
    var data = SOS_DATA[currentSosType];
    sosSteps.innerHTML = '';

    data.steps.forEach(function(step, i) {
      var el = document.createElement('div');
      el.className = 'sos-step';
      el.setAttribute('role', 'listitem');
      el.dataset.index = i;

      var doneIcon = '<svg viewBox="0 0 16 16" width="14" height="14" fill="none"><circle cx="8" cy="8" r="7" fill="currentColor" opacity="0.2"/><path d="M5 8 L7 10 L11 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';

      el.innerHTML = '<div class="sos-step-number">' + (i + 1) + '</div>' +
        '<div class="sos-step-content">' +
          '<div class="sos-step-title">' + step.title + '</div>' +
          '<div class="sos-step-desc">' + step.desc + '</div>' +
          '<div class="sos-step-timer">' +
            '<span class="material-symbols-outlined" aria-hidden="true" data-icon="timer"></span> ' +
            step.timer +
          '</div>' +
          '<div class="sos-step-check" data-action="done">' +
            doneIcon + ' Mark Done' +
          '</div>' +
        '</div>';

      el.addEventListener('click', function(e) {
        if (e.target.closest('[data-action="done"]')) return;
        var idx = parseInt(el.dataset.index, 10);
        if (idx > currentStep) {
          currentStep = idx;
          animateStepIn(currentStep);
        }
      });

      el.querySelector('[data-action="done"]').addEventListener('click', function(e) {
        e.stopPropagation();
        var idx = parseInt(el.dataset.index, 10);
        if (stepStates[idx] !== 'done') {
          stepStates[idx] = 'done';
          el.classList.remove('active');
          el.classList.add('done');
          if (idx === currentStep && currentStep < totalSteps - 1) {
            currentStep++;
            animateStepIn(currentStep);
          } else if (idx === currentStep && currentStep === totalSteps - 1) {
            showSosCta();
          }
        }
      });

      sosSteps.appendChild(el);
    });
  }

  function animateStepIn(index) {
    var steps = sosSteps.querySelectorAll('.sos-step');
    steps.forEach(function(s, i) {
      s.classList.remove('active', 'done');
      if (i < index) s.classList.add('done');
      if (i === index) {
        void s.offsetWidth;
        s.classList.add('active');
      }
    });

    var pct = ((index + 1) / totalSteps) * 100;
    sosProgressFill.style.width = pct + '%';
    sosProgressLabel.textContent = 'Step ' + (index + 1) + ' of ' + totalSteps;

    sosPrev.disabled = index === 0;
  }

  function nextStep() {
    if (currentStep < totalSteps - 1) {
      var steps = sosSteps.querySelectorAll('.sos-step');
      var currentStepEl = steps[currentStep];
      if (currentStepEl && stepStates[currentStep] !== 'done') {
        stepStates[currentStep] = 'done';
        currentStepEl.classList.remove('active');
        currentStepEl.classList.add('done');
      }
      currentStep++;
      animateStepIn(currentStep);
    } else {
      var steps2 = sosSteps.querySelectorAll('.sos-step');
      var currentStepEl2 = steps2[currentStep];
      if (currentStepEl2 && stepStates[currentStep] !== 'done') {
        stepStates[currentStep] = 'done';
        currentStepEl2.classList.remove('active');
        currentStepEl2.classList.add('done');
      }
      showSosCta();
    }
  }

  function prevStep() {
    if (currentStep > 0) {
      currentStep--;
      animateStepIn(currentStep);
    }
  }

  function showSosCta() {
    sosProgressFill.style.width = '100%';
    sosProgressLabel.textContent = 'All done';
    sosPrev.style.display = 'none';
    sosNext.style.display = 'none';
    sosCtaBlock.classList.add('visible', 'sos-cta-activated');
    sosCtaBlock.setAttribute('aria-hidden', 'false');
  }

  document.querySelectorAll('.sos-card').forEach(function(card) {
    card.addEventListener('click', function() {
      var type = card.dataset.sos;
      if (type) openSos(type);
    });
  });

  if (sosClose) sosClose.addEventListener('click', closeSos);
  if (sosBackdrop) sosBackdrop.addEventListener('click', closeSos);
  if (sosPrev) sosPrev.addEventListener('click', prevStep);
  if (sosNext) sosNext.addEventListener('click', nextStep);

  document.addEventListener('keydown', function(e) {
    if (!sosOverlay || !sosOverlay.classList.contains('visible')) return;
    if (e.key === 'Escape') closeSos();
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); nextStep(); }
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); prevStep(); }
  });

  if (sosOverlay) {
    sosOverlay.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') closeSos();
    });
  }

})();


/* ═══════════════════════════════════════════════════
   QUICK FIND — "The HDR Bench" command palette
   Content + markup + behavior live here (single source of
   truth). Styles live in style.css under `.qf-hdr`.
   ═══════════════════════════════════════════════════ */
(function() {
  var overlay = document.getElementById('qfOverlay');
  if (!overlay) return;

  // ---- Content (the only place to edit pages) -------------------
  var QF_DATA = {
    featured: [
      { name: 'iPhone Repair',      href: '/iphone-repair', icon: 'phone_iphone' },
      { name: 'Laptop & PC Repair', href: '/laptop-repair', icon: 'laptop' },
      { name: 'Android Repair',     href: '/android-repair', icon: 'smartphone' },
      { name: 'Data Recovery',      href: '/data-recovery', icon: 'sd_card' },
      { name: 'Pricing',            href: '/pricing', icon: 'payments' },
      { name: 'Book a Repair',      href: '/contact', icon: 'chat' }
    ],
    categories: [
      { title: 'Device Repair', icon: 'devices', links: [
        { name: 'iPhone Repair', desc: 'Screen, battery, charging port & more', href: '/iphone-repair', icon: 'phone_iphone', kw: 'iphone repair screen battery phone apple' },
        { name: 'Android Repair', desc: 'Samsung, Pixel, OnePlus & more', href: '/android-repair', icon: 'smartphone', kw: 'android repair samsung galaxy pixel phone' },
        { name: 'Laptop & PC Repair', desc: 'Mac, Windows, Chromebook', href: '/laptop-repair', icon: 'laptop', kw: 'laptop repair mac pc computer macbook screen battery' },
        { name: "Laptop Won't Turn On", desc: 'No power, black screen, charging failures', href: '/laptop-wont-turn-on', icon: 'offline_bolt', kw: "laptop won't turn on dead laptop no power black screen no charging light macbook chromebook usb c" },
        { name: 'Gaming PC Repair', desc: 'Overheating, crashes & custom builds', href: '/gaming-pc-repair', icon: 'sports_esports', kw: 'gaming pc repair custom build gpu upgrade overheating frame drops blue screens' },
        { name: 'iPad & Tablet', desc: 'iPad, Galaxy Tab, Amazon Fire', href: '/tablet-repair', icon: 'tablet', kw: 'tablet ipad repair screen battery galaxy tab fire' },
        { name: 'Game Console Repair', desc: 'Switch, PS5, Xbox, Steam Deck', href: '/console-repair', icon: 'sports_esports', kw: 'console game nintendo switch ps5 xbox steam deck controller drift' },
        { name: 'Mail-In Repair', desc: 'Ship from anywhere in Idaho', href: '/mail-in-repair', icon: 'local_shipping', kw: 'mail in repair ship statewide idaho send' },
        { name: 'Electronics Recycling', desc: 'Recycle old devices with data-safe handling', href: '/electronics-recycling', icon: 'recycling', kw: 'electronics recycling recycle ewaste e waste old laptop phone ipad tablet battery data destruction parts donor' },
        { name: 'Mail-In iPhone Repair', desc: 'Idaho-wide iPhone shipping guide', href: '/mail-in/iphone', icon: 'phone_iphone', kw: 'mail in iphone repair idaho ship iphone cracked screen back glass battery' },
        { name: 'Mail-In MacBook Repair', desc: 'Idaho-wide MacBook shipping guide', href: '/mail-in/macbook', icon: 'laptop_mac', kw: 'mail in macbook repair idaho ship macbook battery screen keyboard charging' },
        { name: 'Mail-In iPad Repair', desc: 'Idaho-wide iPad shipping guide', href: '/mail-in/ipad', icon: 'tablet_mac', kw: 'mail in ipad repair idaho ship ipad cracked glass battery charging' }
      ]},
      { title: 'Computer Help', icon: 'computer', links: [
        { name: 'Computer Help & IT', desc: 'Slow PC, crashes, startup issues', href: '/computer-support', icon: 'computer', kw: 'computer help support slow pc crash startup it' },
        { name: 'Virus & Malware Removal', desc: 'Pop-ups, hijacks, fake alerts', href: '/virus-removal', icon: 'coronavirus', kw: 'virus malware removal pop ups fake alerts browser hijack scareware' },
        { name: 'Printer Setup & Wi-Fi', desc: 'Wireless printers, drivers, scanning', href: '/printer-setup', icon: 'print', kw: 'printer setup wifi wireless connect driver scan' }
      ]},
      { title: 'Emergency', icon: 'bolt', links: [
        { name: 'Repair SOS', desc: 'Water damage, black screen, boot loop first aid', href: '/repair-sos', icon: 'bolt', kw: 'repair sos emergency water damage black screen swollen battery boot loop wet' },
        { name: 'Data Recovery', desc: 'Lost files, photos, drive recovery in Idaho', href: '/data-recovery', icon: 'sd_card', kw: 'data recovery lost files photos hard drive sd card deleted water damage idaho' }
      ]},
      { title: 'Main', icon: 'home', links: [
        { name: 'Homepage', desc: 'All services & quick quote', href: '/', icon: 'home', kw: 'home main homepage landing' },
        { name: 'Device Repair in Hailey', desc: 'Canonical local repair summary', href: '/device-repair-hailey-idaho', icon: 'verified', kw: 'device repair hailey idaho phone laptop computer tablet console local repair wood river valley ai answer' },
        { name: 'Services Overview', desc: 'Every repair I offer', href: '/#services', icon: 'build_circle', kw: 'services repairs all device fix' },
        { name: 'Pricing', desc: 'Transparent, fair, no surprises', href: '/pricing', icon: 'payments', kw: 'pricing cost price quote how much' },
        { name: 'Contact & Get a Quote', desc: 'Text, call, email, or form', href: '/contact', icon: 'chat', kw: 'contact quote text call email reach form' },
        { name: 'Boise / Treasure Valley Repair', desc: 'Regional mail-in option for Boise-area customers', href: '/boise-repair', icon: 'location_city', kw: 'boise repair treasure valley meridian nampa caldwell mail in device repair' },
        { name: 'Rexburg / Upper Valley Repair', desc: 'Student-friendly regional mail-in option', href: '/rexburg-repair', icon: 'school', kw: 'rexburg repair byu idaho sugar city rigby st anthony mail in device repair' },
        { name: 'Twin Falls / Magic Valley Repair', desc: 'Drive up once or mail it — CSI discount', href: '/twin-falls-repair', icon: 'water', kw: 'twin falls repair magic valley jerome burley kimberly csi drive up mail in device repair' },
        { name: 'Ketchum & Sun Valley Repair', desc: 'Same-day repair, 20 minutes down-valley', href: '/ketchum-repair', icon: 'landscape', kw: 'ketchum sun valley elkhorn warm springs phone repair same day north valley tourist' }
      ]},
      { title: 'Resources', icon: 'menu_book', links: [
        { name: 'Device Care Tips', desc: 'Water, batteries, screens, and repair decisions', href: '/tips', icon: 'lightbulb', kw: 'tips advice care protect repair replace water damage lcd oled battery laptop phone' },
        { name: 'Repair Guides', desc: 'What to expect before you book a repair', href: '/guides', icon: 'menu_book', kw: 'repair guides hub iphone screen battery laptop data recovery what to expect before booking procedural' },
        { name: 'FAQ', desc: 'Pricing, turnaround, warranty & more', href: '/faq', icon: 'help', kw: 'faq questions answers how long warranty turnaround' },
        { name: 'Device Check', desc: 'Free instant repair estimate', href: '/device-check', icon: 'manage_search', kw: 'device check estimate instant free diagnostic whats wrong' },
        { name: 'Warranty', desc: '40-day guarantee on every repair', href: '/warranty', icon: 'verified', kw: 'warranty guarantee coverage 40 day parts labor' },
        { name: 'Student & Military Discount', desc: '15% off — just show your ID', href: '/student-military', icon: 'percent', kw: 'student military discount 15 percent off id college veteran' }
      ]},
      { title: 'About', icon: 'info', links: [
        { name: 'About HDR', desc: 'Meet Samuel — your local repair tech', href: '/about', icon: 'person', kw: 'about sam samuel who person story local repair tech' },
        { name: 'Why HDR?', desc: 'Why choose HDR over chain stores', href: '/why-hdr', icon: 'verified', kw: 'why hdr choose local independent repair vs chain alternative best' },
        { name: 'Privacy Policy', desc: 'How your data is handled', href: '/privacy', icon: 'shield', kw: 'privacy policy data information cookies' }
      ]}
    ]
  };

  // ---- Helpers --------------------------------------------------
  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function icon(name) {
    return '<span aria-hidden="true" class="material-symbols-outlined" data-icon="' + esc(name) + '"></span>';
  }

  function linkHTML(l) {
    return '<a class="qf-link" data-qf="' + esc(l.kw) + '" data-name="' + esc(l.name) + '" href="' + esc(l.href) + '">' +
      '<div class="qf-link-icon">' + icon(l.icon) + '</div>' +
      '<div class="qf-link-text"><span class="qf-link-name">' + esc(l.name) + '</span>' +
      '<span class="qf-link-desc">' + esc(l.desc) + '</span></div>' +
      '<span class="qf-route">' + esc(l.href) + '</span></a>';
  }

  function categoryHTML(c) {
    var links = c.links.map(linkHTML).join('');
    return '<div class="qf-category">' +
      '<div class="qf-category-title">' + icon(c.icon) + ' ' + esc(c.title) + '</div>' +
      links + '</div>';
  }

  function tileHTML(t) {
    return '<a class="qf-tile" href="' + esc(t.href) + '">' +
      '<span class="qf-tile-icon">' + icon(t.icon) + '</span>' +
      '<span class="qf-tile-name">' + esc(t.name) + '</span></a>';
  }

  function countLinks() {
    var n = 0;
    QF_DATA.categories.forEach(function(c) { n += c.links.length; });
    return n;
  }

  function render() {
    var featured = QF_DATA.featured.map(tileHTML).join('');
    var cats = QF_DATA.categories.map(categoryHTML).join('');
    overlay.classList.add('qf-hdr');
    overlay.innerHTML =
      '<div class="qf-backdrop" id="qfBackdrop"></div>' +
      '<div class="qf-panel" role="document">' +
        '<div class="qf-header">' +
          icon('search') +
          '<input autocomplete="off" class="qf-search" id="qfSearch" placeholder="Search pages…" type="text" aria-label="Search pages"/>' +
          '<button aria-label="Close Quick Find" class="qf-close" id="qfClose">ESC</button>' +
        '</div>' +
        '<div class="qf-body" id="qfBody">' +
          '<div class="qf-cursor" id="qfCursor" aria-hidden="true"></div>' +
          '<div class="qf-featured" id="qfFeatured">' +
            '<div class="qf-section-label">// most wanted</div>' +
            '<div class="qf-tiles">' + featured + '</div>' +
          '</div>' +
          '<div class="qf-all" id="qfAll">' +
            '<div class="qf-section-label" id="qfAllLabel">// all pages</div>' +
            '<div class="qf-columns" id="qfColumns">' + cats + '</div>' +
          '</div>' +
          '<div class="qf-empty" id="qfEmpty">' + icon('search_off') + ' No pages match your search.</div>' +
        '</div>' +
        '<div class="qf-footer">' +
          '<span>' + countLinks() + ' pages</span>' +
          '<div class="qf-footer-keys">' +
            '<span><kbd>↑↓</kbd> Navigate</span><span><kbd>↵</kbd> Open</span><span><kbd>ESC</kbd> Close</span>' +
          '</div>' +
        '</div>' +
      '</div>';
  }

  render();

  // ---- Behavior -------------------------------------------------
  var searchInput = document.getElementById('qfSearch');
  var closeBtn    = document.getElementById('qfClose');
  var backdrop    = document.getElementById('qfBackdrop');
  var emptyState  = document.getElementById('qfEmpty');
  var columns     = document.getElementById('qfColumns');
  var featured    = document.getElementById('qfFeatured');
  var allLabel    = document.getElementById('qfAllLabel');
  var body        = document.getElementById('qfBody');
  var cursor      = document.getElementById('qfCursor');
  var allLinks    = overlay.querySelectorAll('.qf-link');
  var allCats     = overlay.querySelectorAll('.qf-category');
  var activeIndex = -1;
  var activeItems = [];

  function activeList() {
    // Featured tiles are navigable only when the featured row is visible.
    var sel = featured.classList.contains('hidden')
      ? '.qf-link:not(.hidden)'
      : '.qf-tile, .qf-link:not(.hidden)';
    return Array.prototype.slice.call(overlay.querySelectorAll(sel));
  }

  function clearActive() {
    activeItems.forEach(function(el) { el.classList.remove('qf-active'); });
    if (cursor) cursor.style.opacity = '0';
  }

  function setActive(index) {
    activeItems.forEach(function(el) { el.classList.remove('qf-active'); });
    if (index < 0 || index >= activeItems.length) { if (cursor) cursor.style.opacity = '0'; return; }
    var el = activeItems[index];
    el.classList.add('qf-active');
    el.scrollIntoView({ block: 'nearest' });
    if (cursor && body) {
      var br = body.getBoundingClientRect();
      var er = el.getBoundingClientRect();
      cursor.style.opacity = '1';
      cursor.style.transform = 'translateY(' + (er.top - br.top + body.scrollTop) + 'px)';
      cursor.style.height = er.height + 'px';
      cursor.style.left = (er.left - br.left) + 'px';
      cursor.style.width = er.width + 'px';
    }
  }

  function open() {
    overlay.classList.add('open');
    overlay.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    if (searchInput) { searchInput.value = ''; searchInput.focus(); }
    showAll();
    activeIndex = -1;
    activeItems = activeList();
  }

  function close() {
    overlay.classList.remove('open');
    overlay.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    activeIndex = -1;
    clearActive();
  }

  function showAll() {
    allLinks.forEach(function(link) {
      link.classList.remove('hidden');
      var nameEl = link.querySelector('.qf-link-name');
      if (nameEl) nameEl.textContent = link.getAttribute('data-name');
    });
    allCats.forEach(function(cat) { cat.classList.remove('hidden'); });
    featured.classList.remove('hidden');
    if (allLabel) allLabel.textContent = '// all pages';
    if (emptyState) emptyState.classList.remove('visible');
    if (columns) columns.classList.remove('hidden');
    clearActive();
  }

  function highlight(nameEl, name, q) {
    var i = name.toLowerCase().indexOf(q);
    if (i === -1) { nameEl.textContent = name; return; }
    nameEl.innerHTML = esc(name.slice(0, i)) +
      '<mark class="qf-hl">' + esc(name.slice(i, i + q.length)) + '</mark>' +
      esc(name.slice(i + q.length));
  }

  function filter(query) {
    var q = (query || '').toLowerCase().trim();
    if (!q) { showAll(); activeIndex = -1; activeItems = activeList(); return; }

    featured.classList.add('hidden');
    if (allLabel) allLabel.textContent = '// matches';
    var any = false;

    allLinks.forEach(function(link) {
      var name = link.getAttribute('data-name') || '';
      var desc = (link.querySelector('.qf-link-desc') || {}).textContent || '';
      var kw = link.getAttribute('data-qf') || '';
      var hay = (name + ' ' + desc + ' ' + kw).toLowerCase();
      var nameEl = link.querySelector('.qf-link-name');
      if (hay.indexOf(q) !== -1) {
        link.classList.remove('hidden');
        if (nameEl) highlight(nameEl, name, q);
        any = true;
      } else {
        link.classList.add('hidden');
        if (nameEl) nameEl.textContent = name;
      }
    });

    allCats.forEach(function(cat) {
      var has = cat.querySelectorAll('.qf-link:not(.hidden)').length > 0;
      cat.classList.toggle('hidden', !has);
    });

    if (emptyState) emptyState.classList.toggle('visible', !any);
    if (columns) columns.classList.toggle('hidden', !any);
    activeIndex = -1;
    clearActive();
    activeItems = activeList();
  }

  // Triggers
  var trigger = document.getElementById('qfTrigger');
  var triggerMobile = document.getElementById('qfTriggerMobile');
  if (trigger) trigger.addEventListener('click', open);
  if (triggerMobile) triggerMobile.addEventListener('click', function() {
    var mobileNav = document.getElementById('navMobile');
    if (mobileNav) mobileNav.setAttribute('aria-hidden', 'true');
    open();
  });

  if (closeBtn) closeBtn.addEventListener('click', close);
  if (backdrop) backdrop.addEventListener('click', close);
  if (searchInput) searchInput.addEventListener('input', function() { filter(this.value); });

  document.addEventListener('keydown', function(e) {
    if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) {
      e.preventDefault();
      if (overlay.classList.contains('open')) { close(); } else { open(); }
      return;
    }
    if (!overlay.classList.contains('open')) return;
    if (e.key === 'Escape') { e.preventDefault(); close(); return; }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      activeItems = activeList();
      activeIndex = Math.min(activeIndex + 1, activeItems.length - 1);
      setActive(activeIndex);
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      activeItems = activeList();
      activeIndex = Math.max(activeIndex - 1, 0);
      setActive(activeIndex);
      return;
    }
    if (e.key === 'Enter') {
      if (activeIndex >= 0 && activeIndex < activeItems.length) {
        e.preventDefault();
        activeItems[activeIndex].click();
      }
      return;
    }
  });

  // Close on any link/tile click
  overlay.addEventListener('click', function(e) {
    if (e.target.closest('.qf-link') || e.target.closest('.qf-tile')) close();
  });
})();
