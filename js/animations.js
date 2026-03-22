'use strict';

/**
 * Animations module — scroll reveal, staggered children, reduced motion, scroll indicator.
 */
function initAnimations() {
  const animatedElements = $$('.animate-on-scroll, .hero-entrance');
  const scrollIndicator = $('.scroll-indicator');
  const mobileCta = $('.mobile-cta-bar');
  const hero = $('#hero');
  const footer = $('#site-footer');

  // ─── 1 & 2. Scroll reveal with staggered children ─────────────────

  initScrollReveal(animatedElements);

  // ─── 3. Scroll indicator fade-out ─────────────────────────────────

  initScrollIndicator(scrollIndicator);

  // ─── 4. Mobile CTA bar visibility ─────────────────────────────────

  initMobileCtaBar(mobileCta, hero, footer);
}

/** Reveal elements on scroll using IntersectionObserver, respecting prefers-reduced-motion */
function initScrollReveal(elements) {
  if (elements.length === 0) return;

  // Reduced motion — immediately reveal all, skip observer
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  if (prefersReducedMotion.matches) {
    elements.forEach((el) => el.classList.add('visible'));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          // One-time animation — unobserve after reveal
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.1,
      rootMargin: '-50px',
    }
  );

  elements.forEach((el) => observer.observe(el));
}

/** Fade out the scroll indicator after scrolling past a threshold */
function initScrollIndicator(indicator) {
  if (!indicator) return;

  const FADE_THRESHOLD = 200;

  const handleScroll = throttle(() => {
    if (window.scrollY > FADE_THRESHOLD) {
      indicator.style.opacity = '0';
      indicator.style.pointerEvents = 'none';
    } else {
      indicator.style.opacity = '1';
      indicator.style.pointerEvents = '';
    }
  }, 100);

  window.addEventListener('scroll', handleScroll, { passive: true });

  // Initialize on load
  handleScroll();
}

/** Show/hide mobile CTA bar — visible when scrolled past hero, hidden when footer is in view */
function initMobileCtaBar(ctaBar, hero, footer) {
  if (!ctaBar) return;

  // Use IntersectionObserver for both hero and footer
  let pastHero = false;
  let footerVisible = false;

  const updateCtaVisibility = () => {
    if (pastHero && !footerVisible) {
      ctaBar.classList.add('visible');
    } else {
      ctaBar.classList.remove('visible');
    }
  };

  if (hero) {
    const heroObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          // Past hero means hero is NOT intersecting
          pastHero = !entry.isIntersecting;
          updateCtaVisibility();
        });
      },
      { threshold: 0 }
    );
    heroObserver.observe(hero);
  }

  if (footer) {
    const footerObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          footerVisible = entry.isIntersecting;
          updateCtaVisibility();
        });
      },
      { threshold: 0 }
    );
    footerObserver.observe(footer);
  }
}
