// ═══════════════════════════════════════════════════════════
//   HAILEY DEVICE REPAIR — main.js
// ═══════════════════════════════════════════════════════════

(function () {
  'use strict';

  // ─── Promo banner: removed ─────────────────────────────────

  // ─── Theme toggle ────────────────────────────────────────
  const html = document.documentElement;
  const themeToggle = document.getElementById('themeToggle');
  const THEME_KEY = 'hdr-theme';

  function setTheme(theme, announce) {
    html.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_KEY, theme);
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

  // Init: respect saved preference, then system preference (no SR announce on load)
  const saved = localStorage.getItem(THEME_KEY);
  if (saved) {
    setTheme(saved, false);
  } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
    setTheme('light', false);
  }

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const current = html.getAttribute('data-theme');
      setTheme(current === 'dark' ? 'light' : 'dark');
    });
  }

  // Floating theme toggle (available on all pages)
  const floatingToggle = document.getElementById('floatingThemeToggle');
  if (floatingToggle) {
    floatingToggle.addEventListener('click', () => {
      const current = html.getAttribute('data-theme');
      setTheme(current === 'dark' ? 'light' : 'dark');
    });
  }

  // ─── Cookie consent banner ───────────────────────────────
  const cookieBanner = document.getElementById('cookieBanner');
  const cookieAccept = document.getElementById('cookieAccept');
  const cookieDecline = document.getElementById('cookieDecline');
  if (cookieBanner && !localStorage.getItem('hdr_cookie_consent')) {
    setTimeout(() => cookieBanner.classList.add('visible'), 1500);
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
  const nav = document.getElementById('nav');
  if (nav) {
    window.addEventListener('scroll', () => {
      nav.classList.toggle('scrolled', window.scrollY > 10);
    }, { passive: true });
  }

  // ─── Mobile nav hamburger ────────────────────────────────
  const hamburger = document.getElementById('navHamburger');
  const mobileMenu = document.getElementById('navMobile');
  const navBackdrop = document.getElementById('navBackdrop');

  if (hamburger && mobileMenu) {
    const closeMenu = () => {
      hamburger.setAttribute('aria-expanded', 'false');
      mobileMenu.classList.remove('open');
      mobileMenu.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('menu-open');
      if (navBackdrop) navBackdrop.classList.remove('visible');
      hamburger.focus();
    };
    const openMenu = () => {
      hamburger.setAttribute('aria-expanded', 'true');
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
    const name = input.id;
    const validator = validators[name];
    if (!validator) return true;

    const errorEl = document.getElementById(name + 'Error');
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
      const input = contactForm.querySelector('#' + id);
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
      const contactInput = contactForm.querySelector('#contact');
      const issueInput   = contactForm.querySelector('#issue');
      const name    = nameInput.value.trim();
      const contact = contactInput.value.trim();
      const device  = contactForm.querySelector('#device').value;
      const issue   = issueInput.value.trim();
      const mailin  = contactForm.querySelector('#mailinCheck').checked;

      // Run inline validation on all required fields
      const fields = [nameInput, contactInput, issueInput];
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
        submitBtn.innerHTML = '<span class="material-symbols-outlined spin-icon">progress_activity</span> Sending…';
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
          `Mail-In: ${mailin ? 'Yes' : 'No'}\n\nIssue:\n${issue}`
        );
        window.location.href = `mailto:samuel@haileyrepair.com?subject=${subject}&body=${mailBody}`;
        showFormSuccess();
      }

      function showFormSuccess() {
        if (formSuccess) {
          formSuccess.classList.add('visible');
          formSuccess.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
        contactForm.reset();
        // Hide success after 8 seconds
        setTimeout(() => {
          if (formSuccess) formSuccess.classList.remove('visible');
          restoreSubmitBtn();
        }, 8000);
      }

      function restoreSubmitBtn() {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = submitBtn.dataset.originalText || '<span class="material-symbols-outlined">send</span> Send Quote Request';
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

  // ─── Hero typing effect (rotating taglines) ─────────────
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const typerEl = document.getElementById('heroTyper');
  if (typerEl && !prefersReducedMotion) {
    const phrases = [
      'Let me fix it.',
      'Save hundreds.',
      'Same-day repair.',
      'No fix, no charge.',
      'Text me anytime.'
    ];
    let phraseIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    let pauseTimer = null;

    const TYPE_SPEED = 60;
    const DELETE_SPEED = 35;
    const PAUSE_AFTER = 2500;
    const PAUSE_BEFORE = 400;

    // Start after page loads and a small delay
    setTimeout(() => {
      typerEl.classList.add('typing');
      typerEl.textContent = '';
      charIndex = 0;
      typeLoop();
    }, 1000);

    function typeLoop() {
      const current = phrases[phraseIndex];

      if (!isDeleting) {
        // Typing forward
        charIndex++;
        typerEl.textContent = current.slice(0, charIndex);

        if (charIndex === current.length) {
          // Done typing — pause, then delete
          pauseTimer = setTimeout(() => {
            isDeleting = true;
            typeLoop();
          }, PAUSE_AFTER);
          return;
        }
        setTimeout(typeLoop, TYPE_SPEED + Math.random() * 30);
      } else {
        // Deleting
        charIndex--;
        typerEl.textContent = current.slice(0, charIndex);

        if (charIndex === 0) {
          // Done deleting — move to next phrase
          isDeleting = false;
          phraseIndex = (phraseIndex + 1) % phrases.length;
          setTimeout(typeLoop, PAUSE_BEFORE);
          return;
        }
        setTimeout(typeLoop, DELETE_SPEED);
      }
    }
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

  // ─── Back-to-top button ──────────────────────────────────
  const backToTop = document.getElementById('backToTop');
  if (backToTop) {
    window.addEventListener('scroll', () => {
      backToTop.classList.toggle('visible', window.scrollY > 500);
    }, { passive: true });

    backToTop.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
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

  /* ── Page load curtain ────────────────── */
  const curtain = document.getElementById('pageCurtain');
  if (curtain) {
    // Remove curtain once page fully loaded (or after 1.5s max)
    const removeCurtain = () => curtain.classList.add('done');
    if (document.readyState === 'complete') {
      setTimeout(removeCurtain, 300);
    } else {
      window.addEventListener('load', () => setTimeout(removeCurtain, 300));
    }
    // Safety: always remove after 1.5s even if load event is slow
    setTimeout(removeCurtain, 1500);
    // Fix back-button: bfcache restores the page with curtain still active
    window.addEventListener('pageshow', (e) => {
      if (e.persisted) curtain.classList.add('done');
    });
  }

  /* ── 3D card tilt ────────────────────── */
  document.querySelectorAll('.card-tilt').forEach(card => {
    card.addEventListener('mousemove', e => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const midX = rect.width / 2;
      const midY = rect.height / 2;
      const rotY = ((x - midX) / midX) * 6; // max 6deg
      const rotX = ((midY - y) / midY) * 6;
      card.style.transform = `perspective(600px) rotateX(${rotX}deg) rotateY(${rotY}deg)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = 'perspective(600px) rotateX(0) rotateY(0)';
    });
  });

  /* ── Hero floating particles ─────────── */
  const particleContainer = document.querySelector('.hero-particles');
  if (particleContainer && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    for (let i = 0; i < 20; i++) {
      const dot = document.createElement('span');
      dot.classList.add('hero-particle');
      dot.style.left = Math.random() * 100 + '%';
      dot.style.top = (60 + Math.random() * 40) + '%';
      dot.style.animationDuration = (8 + Math.random() * 12) + 's';
      dot.style.animationDelay = (Math.random() * 10) + 's';
      dot.style.width = dot.style.height = (2 + Math.random() * 4) + 'px';
      particleContainer.appendChild(dot);
    }
  }

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

  /* ── Service worker registration ─────── */
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  }

  /* ── Smooth page transitions ──────────── */
  // When clicking internal links, fade out via curtain before navigating
  if (curtain && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.addEventListener('click', e => {
      const link = e.target.closest('a[href]');
      if (!link) return;
      const href = link.getAttribute('href');
      // Only intercept internal navigation (not anchors, tel:, sms:, mailto:, external)
      if (!href || href.startsWith('#') || href.startsWith('tel:') || href.startsWith('sms:') || href.startsWith('mailto:') || href.startsWith('http') || link.target === '_blank') return;
      // Must be a local page link
      if (!href.startsWith('/') && !href.endsWith('.html')) return;
      e.preventDefault();
      curtain.classList.remove('done');
      setTimeout(() => { window.location.href = href; }, 300);
    });
  }

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
          <span class="material-symbols-outlined">${p.icon}</span>
          <span class="dc-option-text">
            <strong>${p.label}</strong>
            <span class="dc-option-sub">${p.sub}</span>
          </span>
          <span class="dc-check"><span class="material-symbols-outlined">check</span></span>
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
              <span class="material-symbols-outlined">${p.icon}</span>
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
          <span class="material-symbols-outlined">check_circle</span>
          <h2>Here's your estimate</h2>
          <p>${data.label} — ${selected.length} repair${selected.length > 1 ? 's' : ''}</p>
          <span class="dc-urgency-badge dc-urgency-badge--${urgClass}">
            <span class="material-symbols-outlined">schedule</span> ${urgText}
          </span>
        </div>

        <div class="dc-estimate-card">
          <div class="dc-estimate-card-header">
            <span class="material-symbols-outlined">description</span>
            Repair Breakdown
          </div>
          <div class="dc-estimate-rows">
            ${rowsHTML}
            <div class="dc-estimate-row">
              <span class="dc-estimate-label">
                <span class="material-symbols-outlined">timer</span>
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
          <a href="sms:+12083666111?body=${smsBody}" class="btn btn-primary">
            <span class="material-symbols-outlined">sms</span> Text This Estimate to Samuel
          </a>
          <a href="/contact" class="btn btn-outline">
            <span class="material-symbols-outlined">description</span> Request Full Quote
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
      return;
    }
    if (timelineTop + timelineH < 0) {
      fill.style.height = '100%';
      return;
    }

    // Progress: 0 when section top hits viewport bottom, 1 when section bottom hits viewport top
    var scrolled = viewH - timelineTop;
    var total = viewH + timelineH;
    var pct = Math.max(0, Math.min(100, (scrolled / total) * 125));

    fill.style.height = (reduceMotion ? 100 : pct) + '%';
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
