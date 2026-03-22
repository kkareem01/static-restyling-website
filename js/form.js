'use strict';

/**
 * Form module — validation, phone formatting, honeypot, submission.
 */
function initForm() {
  const form = $('#quote-form');
  if (!form) return;

  const nameField = $('#name');
  const phoneField = $('#phone');
  const emailField = $('#email');
  const honeypot = $('input[name="_gotcha"]', form);
  const submitBtn = $('button[type="submit"]', form);
  const formStatus = $('#form-status');

  // ─── Validation rules ─────────────────────────────────────────────

  const PHONE_PATTERN = /^[\d\s\-()]+$/;
  const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const MIN_PHONE_DIGITS = 10;

  /** Count digits in a string */
  const countDigits = (str) => (str.match(/\d/g) || []).length;

  /** Validate a single field — returns an error message or null */
  const validateField = (field) => {
    if (!field) return null;

    const value = field.value.trim();
    const id = field.id;

    // Required fields
    if ((id === 'name' || id === 'phone') && value === '') {
      return 'This field is required.';
    }

    // Phone validation
    if (id === 'phone' && value !== '') {
      if (!PHONE_PATTERN.test(value)) {
        return 'Please enter a valid phone number.';
      }
      if (countDigits(value) < MIN_PHONE_DIGITS) {
        return 'Phone number must have at least 10 digits.';
      }
    }

    // Email validation (only if provided)
    if (id === 'email' && value !== '') {
      if (!EMAIL_PATTERN.test(value)) {
        return 'Please enter a valid email address.';
      }
    }

    return null;
  };

  // ─── Error display helpers ─────────────────────────────────────────

  /** Show error on a field */
  const showFieldError = (field, message) => {
    if (!field) return;

    const formGroup = field.closest('.form-group');
    if (formGroup) formGroup.classList.add('error');
    field.classList.add('error');

    // Create or update error message span
    let errorSpan = formGroup
      ? $('.error-message', formGroup)
      : null;

    if (!errorSpan && formGroup) {
      errorSpan = document.createElement('span');
      errorSpan.className = 'error-message';
      errorSpan.setAttribute('role', 'alert');
      formGroup.appendChild(errorSpan);
    }

    if (errorSpan) {
      errorSpan.textContent = message;
    }
  };

  /** Clear error from a field */
  const clearFieldError = (field) => {
    if (!field) return;

    const formGroup = field.closest('.form-group');
    if (formGroup) formGroup.classList.remove('error');
    field.classList.remove('error');

    const errorSpan = formGroup ? $('.error-message', formGroup) : null;
    if (errorSpan) {
      errorSpan.textContent = '';
    }
  };

  /** Validate all required fields, return true if form is valid */
  const validateForm = () => {
    const fieldsToValidate = [nameField, phoneField, emailField];
    let isValid = true;

    fieldsToValidate.forEach((field) => {
      if (!field) return;
      const error = validateField(field);
      if (error) {
        showFieldError(field, error);
        isValid = false;
      } else {
        clearFieldError(field);
      }
    });

    return isValid;
  };

  // ─── Phone formatting ─────────────────────────────────────────────

  /** Format a digit string as (XXX) XXX-XXXX */
  const formatPhone = (digits) => {
    if (digits.length === 0) return '';
    if (digits.length <= 3) return `(${digits}`;
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
  };

  if (phoneField) {
    phoneField.addEventListener('input', () => {
      const digits = phoneField.value.replace(/\D/g, '').slice(0, 10);
      const formatted = formatPhone(digits);

      // Only update if the format changed (avoids cursor jump on identical values)
      if (phoneField.value !== formatted) {
        phoneField.value = formatted;
      }
    });
  }

  // ─── Real-time validation — validate on blur, clear on input ──────

  const watchedFields = [nameField, phoneField, emailField].filter(Boolean);

  watchedFields.forEach((field) => {
    field.addEventListener('blur', () => {
      const error = validateField(field);
      if (error) {
        showFieldError(field, error);
      } else {
        clearFieldError(field);
      }
    });

    field.addEventListener('input', () => {
      // Clear error as user types (will re-validate on blur or submit)
      const error = validateField(field);
      if (!error) {
        clearFieldError(field);
      }
    });
  });

  // ─── Form status messages ─────────────────────────────────────────

  const showFormStatus = (type, message) => {
    if (!formStatus) return;
    formStatus.className = `form-status ${type}`;
    formStatus.textContent = message;
  };

  const clearFormStatus = () => {
    if (!formStatus) return;
    formStatus.className = 'form-status';
    formStatus.textContent = '';
  };

  // ─── Submit handler ────────────────────────────────────────────────

  /** Store original button text for restoration */
  const originalBtnText = submitBtn ? submitBtn.innerHTML : '';

  /** Set button to loading state */
  const setLoadingState = () => {
    if (!submitBtn) return;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending...';
  };

  /** Restore button to normal state */
  const restoreButton = () => {
    if (!submitBtn) return;
    submitBtn.disabled = false;
    submitBtn.innerHTML = originalBtnText;
  };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearFormStatus();

    // Honeypot — silently "succeed" if filled (bot)
    if (honeypot && honeypot.value.trim() !== '') {
      showFormStatus('success', 'Thank you! We\'ve received your quote request and will get back to you within a few hours.');
      form.reset();
      return;
    }

    // Validate
    if (!validateForm()) return;

    // Submit via fetch
    setLoadingState();

    try {
      const formData = new FormData(form);
      const actionUrl = form.getAttribute('action');

      const response = await fetch(actionUrl, {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json',
        },
      });

      if (response.ok) {
        showFormStatus(
          'success',
          'Thank you! We\'ve received your quote request and will get back to you within a few hours.'
        );
        form.reset();
      } else {
        throw new Error(`Server responded with ${response.status}`);
      }
    } catch (error) {
      showFormStatus(
        'error',
        'Something went wrong. Please call us at (404) 452-7659 instead.'
      );
    } finally {
      restoreButton();

      // Re-init Lucide icons in case the button has icon markup
      if (typeof lucide !== 'undefined') {
        try { lucide.createIcons(); } catch (_) { /* ignore */ }
      }
    }
  });
}
