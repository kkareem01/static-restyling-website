'use strict';

/**
 * Gallery module — filter tabs, lightbox, before/after slider.
 */
function initGallery() {
  initFilterTabs();
  initLightbox();
  initBeforeAfterSlider();
}

// ─── 1. Filter tabs ──────────────────────────────────────────────────

function initFilterTabs() {
  const filterTabs = $$('.gallery-filters .filter-tab');
  const galleryItems = $$('.gallery-grid .gallery-item');

  if (filterTabs.length === 0 || galleryItems.length === 0) return;

  /** Apply filter — show/hide items, update tab states */
  const applyFilter = (activeFilter) => {
    // Update tabs
    filterTabs.forEach((tab) => {
      const isActive = tab.getAttribute('data-filter') === activeFilter;
      tab.classList.toggle('active', isActive);
      tab.setAttribute('aria-selected', String(isActive));
    });

    // Filter gallery items
    galleryItems.forEach((item) => {
      const category = item.getAttribute('data-category');
      const shouldShow = activeFilter === 'all' || category === activeFilter;

      if (shouldShow) {
        item.classList.remove('hidden');
        // Trigger fade-in by removing and re-adding the element to reflow
        item.style.animation = 'none';
        // Force reflow
        void item.offsetHeight;
        item.style.animation = '';
      } else {
        item.classList.add('hidden');
      }
    });
  };

  filterTabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const filter = tab.getAttribute('data-filter');
      applyFilter(filter);
    });
  });
}

// ─── 2. Lightbox ─────────────────────────────────────────────────────

function initLightbox() {
  const lightbox = $('#lightbox');
  const lightboxImage = $('.lightbox-image', lightbox);
  const lightboxClose = $('.lightbox-close', lightbox);
  const lightboxPrev = $('.lightbox-prev', lightbox);
  const lightboxNext = $('.lightbox-next', lightbox);
  const galleryItems = $$('.gallery-grid .gallery-item');

  if (!lightbox || galleryItems.length === 0) return;

  // State — track current index immutably
  let state = Object.freeze({ currentIndex: 0, isOpen: false });

  /** Create a new lightbox state */
  const createState = (index, isOpen) => Object.freeze({
    currentIndex: index,
    isOpen,
  });

  /** Get only visible (non-hidden) gallery items */
  const getVisibleItems = () => galleryItems.filter(
    (item) => !item.classList.contains('hidden')
  );

  /** Display the image at the given index in visible items */
  const showImage = (index) => {
    const visibleItems = getVisibleItems();
    if (visibleItems.length === 0) return;

    // Clamp index
    const clampedIndex = ((index % visibleItems.length) + visibleItems.length) % visibleItems.length;
    state = createState(clampedIndex, true);

    const item = visibleItems[clampedIndex];
    const caption = $('.gallery-caption', item);
    const captionText = caption ? caption.textContent : '';

    // Use background-color of gallery-image div as a visual placeholder
    const imageDiv = $('.gallery-image', item);
    const computedBg = imageDiv
      ? window.getComputedStyle(imageDiv).backgroundColor
      : '#333';

    // Check if the gallery-image has a background-image set
    const bgImage = imageDiv
      ? window.getComputedStyle(imageDiv).backgroundImage
      : 'none';

    if (bgImage && bgImage !== 'none') {
      lightboxImage.style.backgroundImage = bgImage;
      lightboxImage.style.backgroundColor = '';
    } else {
      lightboxImage.style.backgroundImage = '';
      lightboxImage.style.backgroundColor = computedBg;
    }

    lightboxImage.setAttribute('aria-label', captionText);
  };

  /** Open the lightbox */
  const openLightbox = (index) => {
    showImage(index);
    lightbox.classList.add('active');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';

    // Trap focus — move focus into lightbox
    lightboxClose.focus();
  };

  /** Close the lightbox */
  const closeLightbox = () => {
    state = createState(state.currentIndex, false);
    lightbox.classList.remove('active');
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  };

  /** Navigate to next visible image */
  const nextImage = () => {
    const visibleCount = getVisibleItems().length;
    if (visibleCount === 0) return;
    showImage(state.currentIndex + 1);
  };

  /** Navigate to previous visible image */
  const prevImage = () => {
    const visibleCount = getVisibleItems().length;
    if (visibleCount === 0) return;
    showImage(state.currentIndex - 1);
  };

  // Click gallery items to open lightbox
  galleryItems.forEach((item) => {
    item.addEventListener('click', () => {
      const visibleItems = getVisibleItems();
      const indexInVisible = visibleItems.indexOf(item);
      if (indexInVisible === -1) return;
      openLightbox(indexInVisible);
    });
  });

  // Lightbox controls
  if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox);
  if (lightboxPrev) lightboxPrev.addEventListener('click', prevImage);
  if (lightboxNext) lightboxNext.addEventListener('click', nextImage);

  // Close on backdrop click (click on lightbox itself, not its children)
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox || e.target.classList.contains('lightbox-content')) {
      closeLightbox();
    }
  });

  // Keyboard navigation
  document.addEventListener('keydown', (e) => {
    if (!state.isOpen) return;

    switch (e.key) {
      case 'Escape':
        closeLightbox();
        break;
      case 'ArrowLeft':
        prevImage();
        break;
      case 'ArrowRight':
        nextImage();
        break;
    }
  });

  // Focus trap inside lightbox
  lightbox.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab' || !state.isOpen) return;

    const focusable = $$('button, [href], [tabindex]:not([tabindex="-1"])', lightbox);
    if (focusable.length === 0) return;

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

// ─── 3. Before/After slider ─────────────────────────────────────────

function initBeforeAfterSlider() {
  const container = $('.before-after-container');
  const beforeImage = container ? $('.before-image', container) : null;
  const slider = container ? $('.before-after-slider', container) : null;

  if (!container || !beforeImage || !slider) return;

  let isDragging = false;

  /** Clamp a value between min and max */
  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

  /** Update the slider position and clip-path */
  const updateSlider = (percentage) => {
    const clamped = clamp(percentage, 0, 100);
    beforeImage.style.clipPath = `inset(0 ${100 - clamped}% 0 0)`;
    slider.style.left = `${clamped}%`;
  };

  /** Calculate percentage from a client X coordinate */
  const getPercentage = (clientX) => {
    const rect = container.getBoundingClientRect();
    return ((clientX - rect.left) / rect.width) * 100;
  };

  // Initialize at 50%
  updateSlider(50);

  // Mouse events
  const onMouseDown = (e) => {
    isDragging = true;
    container.style.cursor = 'ew-resize';
    updateSlider(getPercentage(e.clientX));
  };

  const onMouseMove = (e) => {
    if (!isDragging) return;
    updateSlider(getPercentage(e.clientX));
  };

  const onMouseUp = () => {
    if (!isDragging) return;
    isDragging = false;
    container.style.cursor = '';
  };

  container.addEventListener('mousedown', onMouseDown);
  document.addEventListener('mousemove', onMouseMove);
  document.addEventListener('mouseup', onMouseUp);

  // Touch events
  const onTouchStart = (e) => {
    isDragging = true;
    const touch = e.touches[0];
    updateSlider(getPercentage(touch.clientX));
  };

  const onTouchMove = (e) => {
    if (!isDragging) return;
    const touch = e.touches[0];
    updateSlider(getPercentage(touch.clientX));
  };

  const onTouchEnd = () => {
    isDragging = false;
  };

  container.addEventListener('touchstart', onTouchStart, { passive: true });
  container.addEventListener('touchmove', onTouchMove, { passive: true });
  container.addEventListener('touchend', onTouchEnd, { passive: true });
}
