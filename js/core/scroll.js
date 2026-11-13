/**
 * Smooth scrolling (Lenis) wired into GSAP ScrollTrigger.
 * When the visitor prefers reduced motion Lenis is skipped and native scrolling is used.
 */
import { gsap, ScrollTrigger, Lenis } from '../vendor.js?v=5';

export function initScroll(env) {
  // phones resize the viewport every time the address bar slides away: don't re-measure for that
  ScrollTrigger.config({ ignoreMobileResize: true });

  let lenis = null;
  if (!env.reducedMotion) {
    lenis = new Lenis({
      lerp: 0.105,
      wheelMultiplier: 0.95,
      smoothWheel: true,
      syncTouch: false, // native momentum on touch screens feels best
    });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  let locks = 0;

  const api = {
    lenis,

    /** Scroll to a selector, element or pixel value. */
    to(target, { offset = 0, duration = 1.5, immediate = false } = {}) {
      if (lenis) {
        lenis.scrollTo(target, {
          offset,
          duration,
          immediate,
          force: true,
          easing: (t) => 1 - Math.pow(1 - t, 4),
        });
        return;
      }
      let top = 0;
      if (typeof target === 'number') top = target;
      else {
        const el = typeof target === 'string' ? document.querySelector(target) : target;
        if (!el) return;
        top = el.getBoundingClientRect().top + window.scrollY + offset;
      }
      window.scrollTo({ top, behavior: immediate || env.reducedMotion ? 'auto' : 'smooth' });
    },

    /** Freeze page scrolling (loader, mobile menu, lightbox). Calls are counted. */
    lock() {
      locks += 1;
      lenis?.stop();
      document.documentElement.classList.add('is-locked');
    },

    unlock() {
      locks = Math.max(0, locks - 1);
      if (locks) return;
      lenis?.start();
      document.documentElement.classList.remove('is-locked');
    },

    get y() {
      return lenis ? lenis.scroll : window.scrollY;
    },
  };

  return api;
}
