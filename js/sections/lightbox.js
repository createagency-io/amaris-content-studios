/**
 * Gallery lightbox. `open(index, fromRect)` zooms the photo out of the given
 * screen rectangle (the panel on the 3D ring, or a thumbnail in lite mode).
 * Arrow keys / buttons / swipe move between photos, Esc closes.
 */
import { gsap } from '../vendor.js?v=5';
import { qs, qsa } from '../core/dom.js?v=5';
import { PHOTOS, img } from '../data/studio.js?v=5';

export function createLightbox({ env, scroll }, items, { rectFor, onChange } = {}) {
  const el = qs('#lightbox');
  const backdrop = qs('.lightbox__backdrop', el);
  const frame = qs('.lightbox__frame', el);
  const image = qs('.lightbox__img', el);
  const caption = qs('.lightbox__caption', el);
  const count = qs('.lightbox__count', el);
  const text = qs('.lightbox__text', el);
  const buttons = qsa('.lightbox__btn', el);
  const pad = (n) => String(n).padStart(2, '0');

  let index = 0;
  let isOpen = false;
  let returnFocus = null;
  const quick = env.reducedMotion;

  function paint(i) {
    index = (i + items.length) % items.length;
    const item = items[index];
    const meta = PHOTOS[item.photo];
    frame.style.setProperty('--ratio', meta.ratio);
    // the 800px file is already cached by the ring / strip, so it shows instantly
    frame.style.backgroundImage = `url("${img(item.photo, 800)}")`;
    image.classList.remove('is-loaded');
    image.alt = meta.alt;
    image.onload = () => image.classList.add('is-loaded');
    image.src = img(item.photo, 1600);
    if (image.complete && image.naturalWidth) image.classList.add('is-loaded');
    count.textContent = `${pad(index + 1)} / ${pad(items.length)}`;
    text.textContent = item.caption;
    onChange?.(index);
  }

  /** Transform that makes the (already laid out) frame sit exactly over `rect`. */
  function flipFrom(rect) {
    const to = frame.getBoundingClientRect();
    return {
      x: rect.left - to.left,
      y: rect.top - to.top,
      scaleX: rect.width / to.width,
      scaleY: rect.height / to.height,
    };
  }

  function open(i, fromRect) {
    if (isOpen) return;
    isOpen = true;
    returnFocus = document.activeElement;
    el.hidden = false;
    paint(i);
    scroll.lock();
    gsap.killTweensOf([frame, backdrop, caption, buttons]);
    gsap.set(frame, { clearProps: 'transform,opacity' });

    if (quick || !fromRect) {
      gsap.fromTo([backdrop, frame, caption, buttons], { opacity: 0 }, { opacity: 1, duration: 0.35 });
    } else {
      gsap.fromTo(backdrop, { opacity: 0 }, { opacity: 1, duration: 0.7, ease: 'power2.out' });
      gsap.fromTo(frame, { ...flipFrom(fromRect), opacity: 1 }, { x: 0, y: 0, scaleX: 1, scaleY: 1, duration: 0.95, ease: 'expo.inOut' });
      gsap.fromTo([caption, buttons], { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.6, delay: 0.55, stagger: 0.04, ease: 'power2.out' });
    }
    qs('.lightbox__btn--close', el).focus({ preventScroll: true });
  }

  function close() {
    if (!isOpen) return;
    isOpen = false;
    const done = () => {
      el.hidden = true;
      image.removeAttribute('src');
      scroll.unlock();
      returnFocus?.focus?.({ preventScroll: true });
    };
    const backTo = !quick && rectFor ? rectFor(index) : null;
    gsap.killTweensOf([frame, backdrop, caption, buttons]);
    gsap.to([caption, buttons], { opacity: 0, duration: 0.25 });
    gsap.to(backdrop, { opacity: 0, duration: 0.6, delay: 0.1, ease: 'power2.inOut' });
    if (backTo) {
      gsap.to(frame, { ...flipFrom(backTo), duration: 0.75, ease: 'expo.inOut', onComplete: done });
    } else {
      gsap.to(frame, { opacity: 0, scale: 0.96, duration: 0.4, ease: 'power2.in', onComplete: done });
    }
  }

  function go(dir) {
    if (!isOpen) return;
    if (quick) {
      paint(index + dir);
      return;
    }
    gsap
      .timeline()
      .to(frame, { x: -40 * dir, opacity: 0, duration: 0.24, ease: 'power2.in' })
      .add(() => paint(index + dir))
      .fromTo(frame, { x: 40 * dir, opacity: 0 }, { x: 0, opacity: 1, duration: 0.45, ease: 'power3.out' });
  }

  /* ---- controls ---- */
  for (const closer of qsa('[data-lightbox-close]', el)) closer.addEventListener('click', close);
  qs('[data-lightbox-prev]', el).addEventListener('click', () => go(-1));
  qs('[data-lightbox-next]', el).addEventListener('click', () => go(1));

  window.addEventListener('keydown', (e) => {
    if (!isOpen) return;
    if (e.key === 'Escape') close();
    else if (e.key === 'ArrowRight') go(1);
    else if (e.key === 'ArrowLeft') go(-1);
    else if (e.key === 'Tab') {
      // keep focus inside the dialog
      const first = buttons[0];
      const last = buttons[buttons.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  });

  // swipe left / right on touch screens
  let startX = null;
  frame.addEventListener('pointerdown', (e) => (startX = e.clientX));
  frame.addEventListener('pointerup', (e) => {
    if (startX == null) return;
    const dx = e.clientX - startX;
    startX = null;
    if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
  });

  return { open, close, get isOpen() { return isOpen; } };
}
