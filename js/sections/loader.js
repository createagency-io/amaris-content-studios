/**
 * 1. Loader — the AS mark fades in on a dark amber double door, a seam of
 * light appears, then the door swings open into the site.
 */
import { gsap } from '../vendor.js';
import { qs, qsa } from '../core/dom.js';

const MIN_VISIBLE_MS = 1900;

export function initLoader({ env, scroll }) {
  const el = qs('#loader');
  const noop = { open: async (onReveal) => onReveal?.() };
  if (!el || document.documentElement.classList.contains('loader-skip')) return noop;

  const pct = qs('.loader__pct', el);
  const marks = qsa('.loader__mark', el);
  const names = qsa('.loader__name', el);
  const startedAt = performance.now();
  const progress = { value: 0 };
  const render = () => {
    pct.textContent = String(Math.round(progress.value * 100)).padStart(2, '0');
  };

  scroll.lock();
  window.scrollTo(0, 0);

  // logo arrives
  gsap.fromTo(marks, { autoAlpha: 0, scale: 0.86 }, { autoAlpha: 1, scale: 1, duration: 1.5, ease: 'power3.out' });
  gsap.fromTo(names, { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 1.2, delay: 0.35, ease: 'power3.out' });
  gsap.fromTo(qs('.loader__meta', el), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.8, delay: 0.5 });

  // the counter creeps towards 90% while assets load, then completes on open()
  const creep = gsap.to(progress, { value: 0.9, duration: 4, ease: 'power2.out', onUpdate: render });

  return {
    /** @param {() => void} onReveal called the moment the doors start to part */
    async open(onReveal) {
      const wait = Math.max(0, MIN_VISIBLE_MS - (performance.now() - startedAt));
      if (wait) await new Promise((r) => setTimeout(r, wait));
      creep.kill();
      await gsap.to(progress, { value: 1, duration: 0.45, ease: 'power2.out', onUpdate: render });

      const finish = () => {
        el.remove();
        scroll.unlock();
      };

      if (env.reducedMotion) {
        onReveal?.();
        await gsap.to(el, { autoAlpha: 0, duration: 0.5 });
        finish();
        return;
      }

      const doors = qsa('.loader__door', el);
      const swing = 1.75;
      const tl = gsap.timeline();
      tl.to(qs('.loader__meta', el), { autoAlpha: 0, y: 10, duration: 0.4, ease: 'power2.in' })
        // a blade of light between the two leaves
        .to(qs('.loader__seam', el), { opacity: 1, scaleY: 1, duration: 0.75, ease: 'power3.inOut' }, '<0.05')
        .addLabel('open', '>-0.05')
        .add(() => onReveal?.(), 'open')
        // the doors swing inward, away from the viewer, darkening as they turn from the light
        .to(doors[0], { rotationY: 92, duration: swing, ease: 'power3.inOut' }, 'open')
        .to(doors[1], { rotationY: -92, duration: swing, ease: 'power3.inOut' }, 'open')
        .to(doors, { '--shade': 1, duration: swing * 0.8, ease: 'power1.in' }, 'open')
        .to(qs('.loader__seam', el), { scaleX: 14, opacity: 0, duration: 0.5, ease: 'power2.out' }, 'open')
        // the page becomes usable as soon as the gap is wide, not when the tween ends
        .add(() => scroll.unlock(), `open+=${swing * 0.6}`)
        .to(el, { autoAlpha: 0, duration: 0.2 }, `open+=${swing - 0.15}`);

      await tl;
      el.remove();
    },
  };
}
