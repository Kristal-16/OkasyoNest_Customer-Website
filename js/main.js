/* ==========================================================
   OkasyoNest – main.js (loaded on index.html AND reservation.html)
   Handles: mobile navigation, header shadow, active-link
   highlighting, and the generic modal open/close behavior.
   Hall data (names, rates, capacity) lives in js/data.js.
   ========================================================== */
(() => {
  'use strict';

  const header = document.getElementById('siteHeader');
  const navToggle = document.getElementById('navToggle');
  const nav = document.getElementById('siteNav');
  let lastFocused = null;

  /* ---------- Mobile navigation ---------- */
  function setNavOpen(open) {
    if (!header || !navToggle) return;
    header.classList.toggle('nav-open', open);
    navToggle.setAttribute('aria-expanded', String(open));
    navToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  }

  function initMobileNav() {
    if (!header || !navToggle || !nav) return;
    navToggle.addEventListener('click', () => setNavOpen(!header.classList.contains('nav-open')));
    nav.addEventListener('click', (e) => { if (e.target.closest('a')) setNavOpen(false); });
    document.addEventListener('click', (e) => { if (!header.contains(e.target)) setNavOpen(false); });
    window.matchMedia('(min-width: 901px)').addEventListener('change', () => setNavOpen(false));
  }

  /* ---------- Header shadow once the page is scrolled ---------- */
  function initHeaderShadow() {
    if (!header) return;
    const update = () => header.classList.toggle('is-scrolled', window.scrollY > 10);
    update();
    window.addEventListener('scroll', update, { passive: true });
  }

  /* ---------- Highlight the nav link of the section in view (index.html only) ---------- */
  function initActiveNav() {
    if (!nav || !('IntersectionObserver' in window)) return;
    const links = [...nav.querySelectorAll('a[href^="#"]')];
    const targets = new Map();
    links.forEach((link) => {
      const section = document.querySelector(link.getAttribute('href'));
      if (section) targets.set(section, link);
    });
    if (!targets.size) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        links.forEach((l) => l.classList.remove('is-active'));
        targets.get(entry.target).classList.add('is-active');
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    targets.forEach((_, section) => observer.observe(section));
  }

  /* ---------- Modals ----------
     Open:  any element with data-modal-open="<modal id>"
     Close: any element with data-modal-close, a click on the dark
            backdrop, or the ESC key. */
  function openModal(id) {
    const modal = document.getElementById(id);
    if (!modal) return;
    lastFocused = document.activeElement;
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
    const closeBtn = modal.querySelector('[data-modal-close]');
    if (closeBtn) closeBtn.focus();
  }

  function closeModal(modal) {
    if (!modal) return;
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    if (!document.querySelector('.modal.is-open')) document.body.classList.remove('modal-open');
    if (lastFocused && typeof lastFocused.focus === 'function') lastFocused.focus();
  }

  function initModals() {
    document.addEventListener('click', (e) => {
      const opener = e.target.closest('[data-modal-open]');
      if (opener) {
        e.preventDefault();
        openModal(opener.dataset.modalOpen);
        return;
      }
      const closer = e.target.closest('[data-modal-close]');
      if (closer) {
        closeModal(closer.closest('.modal'));
        return;
      }
      if (e.target.classList.contains('modal')) closeModal(e.target); /* click on the backdrop */
    });

    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape') return;
      document.querySelectorAll('.modal.is-open').forEach(closeModal);
      setNavOpen(false);
    });
  }

  /* Expose the modal helpers so reservation.js can reuse them. */
  window.OkasyoUI = { openModal, closeModal };

  initMobileNav();
  initHeaderShadow();
  initActiveNav();
  initModals();
})();
