'use strict';

document.addEventListener('DOMContentLoaded', () => {
  // Initialize Lucide icons
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }

  // Initialize all modules
  initNavigation();
  initGallery();
  initAnimations();
  initForm();
});
