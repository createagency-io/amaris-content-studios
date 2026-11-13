/**
 * Navigation — smooth anchor scrolling, scrolled state, active link and the
 * full-screen menu on phones.
 */
import { ScrollTrigger } from '../vendor.js?v=5';
import { qs, qsa } from '../core/dom.js?v=5';

export function initNav({ scroll }) {
  const nav = qs('#nav');
  const menu = qs('#menu');
  const toggle = qs('.nav__toggle', nav);
  const links = qsa('[data-nav]', nav);

  /* ---- phone menu ---- */
  let open = false;
  function setMenu(next) {
    if (open === next) return;
    open = next;
    menu.classList.toggle('is-open', open);
    menu.setAttribute('aria-hidden', String(!open));
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    if (open) scroll.lock();
    else scroll.unlock();
  }
  toggle.addEventListener('click', () => setMenu(!open));
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') setMenu(false);
  });
  window.matchMedia('(min-width: 900px)').addEventListener('change', (e) => {
    if (e.matches) setMenu(false);
  });

  /* ---- every in-page link scrolls smoothly ---- */
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href^="#"]');
    if (!link || e.defaultPrevented) return;
    const id = link.getAttribute('href');
    if (id.length < 2) return;
    const target = document.querySelector(id);
    if (!target) return;
    e.preventDefault();

    // "Book this room" style links pre-fill the booking form
    if (link.dataset.book) {
      try {
        window.dispatchEvent(new CustomEvent('amaris:book', { detail: JSON.parse(link.dataset.book) }));
      } catch {
        /* malformed data-book: just scroll */
      }
    }

    // the skip link also hands keyboard focus to the content
    if (link.classList.contains('skip-link')) target.focus({ preventScroll: true });

    const wasOpen = open;
    setMenu(false);
    // long jumps get a little more time so the 3D sections can breathe
    const distance = Math.abs(target.getBoundingClientRect().top);
    const duration = Math.min(2.4, 1.1 + distance / 9000);
    setTimeout(() => scroll.to(target, { duration }), wasOpen ? 250 : 0);
    history.replaceState(null, '', id);
  });

  /* ---- bar gets its glass once the page has moved ---- */
  ScrollTrigger.create({
    start: 40,
    end: 'max',
    onToggle: (self) => nav.classList.toggle('is-scrolled', self.isActive),
  });

  /* ---- active link ---- */
  const setActive = (id) => {
    for (const a of links) {
      if (a.dataset.nav === id) a.setAttribute('aria-current', 'true');
      else a.removeAttribute('aria-current');
    }
  };
  for (const section of qsa('[data-section]')) {
    const id = section.dataset.section;
    // "about" has no link of its own: it belongs to Home
    const navId = id === 'about' ? 'home' : id;
    ScrollTrigger.create({
      trigger: section,
      start: 'top 55%',
      end: 'bottom 55%',
      onToggle: (self) => self.isActive && setActive(navId),
    });
  }
}
