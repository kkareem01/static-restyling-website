'use strict';

/**
 * Navigation module — mobile menu, sticky header, smooth scroll, active highlighting.
 */
function initNavigation() {
  const header = $('#site-header');
  const mobileToggle = $('.mobile-menu-toggle');
  const mobileNav = $('.mobile-nav');
  const mobileNavLinks = $$('a', mobileNav);
  const desktopNavLinks = $$('.desktop-nav a');
  const allAnchorLinks = $$('a[href^="#"]');
  const sections = $$('section[id]');

  // Guard — abort if critical elements are missing
  if (!header || !mobileToggle || !mobileNav) return;

  // ─── State helpers (immutable pattern) ──────────────────────────────

  /** Returns a new menu-state object */
  const createMenuState = (isOpen) => Object.freeze({ isOpen });

  let menuState = createMenuState(false);

  /** Apply menu state to the DOM */
  const applyMenuState = (state) => {
    if (state.isOpen) {
      mobileNav.classList.add('open');
      mobileToggle.setAttribute('aria-expanded', 'true');
      mobileNav.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    } else {
      mobileNav.classList.remove('open');
      mobileToggle.setAttribute('aria-expanded', 'false');
      mobileNav.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    }
  };

  /** Toggle the mobile menu open/closed */
  const toggleMenu = () => {
    menuState = createMenuState(!menuState.isOpen);
    applyMenuState(menuState);
  };

  /** Close the mobile menu */
  const closeMenu = () => {
    if (!menuState.isOpen) return;
    menuState = createMenuState(false);
    applyMenuState(menuState);
  };

  // ─── 1. Mobile menu toggle ─────────────────────────────────────────

  mobileToggle.addEventListener('click', toggleMenu);

  // Close on clicking a link inside mobile nav
  mobileNavLinks.forEach((link) => {
    link.addEventListener('click', closeMenu);
  });

  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeMenu();
  });

  // ─── 2. Sticky header ─────────────────────────────────────────────

  const SCROLL_THRESHOLD = 80;

  const updateHeaderScroll = throttle(() => {
    if (window.scrollY > SCROLL_THRESHOLD) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  }, 100);

  window.addEventListener('scroll', updateHeaderScroll, { passive: true });

  // Run once on init in case page loads already scrolled
  updateHeaderScroll();

  // ─── 3. Smooth scroll ─────────────────────────────────────────────

  /** Smoothly scroll to a target element accounting for header height */
  const smoothScrollTo = (targetId) => {
    const target = $(targetId);
    if (!target) return;

    const headerHeight = header.offsetHeight;
    const targetPosition = target.getBoundingClientRect().top + window.scrollY - headerHeight;

    window.scrollTo({
      top: targetPosition,
      behavior: 'smooth',
    });
  };

  allAnchorLinks.forEach((link) => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href');
      if (!href || href === '#') return;

      e.preventDefault();
      closeMenu();
      smoothScrollTo(href);
    });
  });

  // ─── 4. Active nav highlighting ───────────────────────────────────

  if (sections.length > 0 && desktopNavLinks.length > 0) {
    const observerCallback = (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        const sectionId = entry.target.getAttribute('id');

        desktopNavLinks.forEach((link) => {
          const linkHref = link.getAttribute('href');
          if (linkHref === `#${sectionId}`) {
            link.classList.add('active');
          } else {
            link.classList.remove('active');
          }
        });
      });
    };

    const observer = new IntersectionObserver(observerCallback, {
      rootMargin: '-20% 0px -60% 0px',
      threshold: 0,
    });

    sections.forEach((section) => observer.observe(section));
  }
}
