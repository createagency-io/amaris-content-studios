/**
 * 5. Gallery — scroll rotates the photo ring, hovering tilts a photo, a click
 * (or tap) zooms into it. Without WebGL the same photos become a swipeable strip.
 */
import { gsap, ScrollTrigger } from '../vendor.js?v=5';
import { qs, qsa, fragment, esc } from '../core/dom.js?v=5';
import { GALLERY, PHOTOS, img } from '../data/studio.js?v=5';
import { createLightbox } from './lightbox.js?v=5';

const pad = (n) => String(n).padStart(2, '0');

export async function initGallery(ctx) {
  const { env, stage } = ctx;
  const section = qs('#gallery');
  const sticky = qs('.gallery__sticky', section);
  const countEl = qs('.gallery__count', section);
  const textEl = qs('.gallery__text', section);

  /* ---------- lite: swipeable strip ---------- */
  if (env.lite || !stage) {
    const strip = qs('.gallery__strip', section);
    strip.append(
      fragment(
        GALLERY.map(
          (item, i) => `
          <button type="button" data-index="${i}" aria-label="Open photo: ${esc(item.caption)}">
            <img src="${img(item.photo, 480)}" srcset="${img(item.photo, 480)} 480w, ${img(item.photo, 800)} 800w" sizes="(min-width: 700px) 340px, 62vw" alt="${esc(PHOTOS[item.photo].alt)}" loading="lazy" decoding="async" width="480" height="640" />
          </button>`
        ).join('')
      )
    );
    const thumbs = qsa('button', strip);
    const lightbox = createLightbox(ctx, GALLERY, {
      rectFor: (i) => thumbs[i].getBoundingClientRect(),
      onChange: (i) => thumbs[i].scrollIntoView({ inline: 'center', block: 'nearest', behavior: env.reducedMotion ? 'auto' : 'smooth' }),
    });
    thumbs.forEach((btn, i) => btn.addEventListener('click', () => lightbox.open(i, btn.getBoundingClientRect())));
    return;
  }

  /* ---------- full: the ring ---------- */
  const { createGalleryScene } = await import('./gallery.scene.js?v=5');
  const ring = createGalleryScene({ stage, slot: qs('.stage-slot', section), items: GALLERY });

  const setCaption = (i) => {
    countEl.textContent = `${pad(i + 1)} / ${pad(GALLERY.length)}`;
    textEl.textContent = GALLERY[i].caption;
  };
  ring.state.onFront = setCaption;
  setCaption(0);

  // scroll turns the ring for as long as the section is anywhere on screen
  ScrollTrigger.create({
    trigger: section,
    start: 'top bottom',
    end: 'bottom top',
    onUpdate: (self) => (ring.state.scroll = self.progress),
  });

  const turnTo = (index, duration = 1.1) =>
    gsap.to(ring.state, { drag: ring.dragTo((index + GALLERY.length) % GALLERY.length), duration, ease: 'power3.inOut', overwrite: true });

  const lightbox = createLightbox(ctx, GALLERY, {
    rectFor: (i) => (i === ring.front ? ring.screenRect(i) : null),
    // keep the ring in step with the lightbox so it closes back into the right photo
    onChange: (i) => lightbox?.isOpen && turnTo(i, 0.6),
  });

  const openFront = () => lightbox.open(ring.front, ring.screenRect(ring.front));
  qs('[data-gallery-open]', section).addEventListener('click', openFront);
  qs('[data-gallery-prev]', section).addEventListener('click', () => turnTo(ring.front - 1));
  qs('[data-gallery-next]', section).addEventListener('click', () => turnTo(ring.front + 1));

  /* ---- pointer: hover tilt, drag to spin, click to zoom ---- */
  let down = null;
  let dragged = false;
  let lastX = 0;
  let velocity = 0;
  const isControl = (target) => target.closest('button, a');

  sticky.addEventListener('pointerdown', (e) => {
    if (isControl(e.target) || (e.pointerType === 'mouse' && e.button !== 0)) return;
    down = { x: e.clientX, y: e.clientY };
    dragged = false;
    lastX = e.clientX;
    velocity = 0;
    gsap.killTweensOf(ring.state, 'drag');
  });

  window.addEventListener(
    'pointermove',
    (e) => {
      if (down) {
        const dx = e.clientX - lastX;
        lastX = e.clientX;
        if (!dragged && Math.abs(e.clientX - down.x) > 8 && Math.abs(e.clientX - down.x) > Math.abs(e.clientY - down.y)) {
          dragged = true;
          sticky.classList.add('is-dragging');
          ring.state.dragging = true;
          ring.state.hover = -1;
        }
        if (dragged) {
          const spin = -dx * (env.coarse ? 0.0065 : 0.0042);
          ring.state.drag += spin;
          velocity = spin;
        }
        return;
      }
      if (e.pointerType !== 'mouse' || isControl(e.target) || !sticky.contains(e.target)) {
        if (ring.state.hover !== -1) {
          ring.state.hover = -1;
          sticky.classList.remove('is-hovering');
        }
        return;
      }
      const hit = ring.pick(e.clientX, e.clientY);
      ring.state.hover = hit ? hit.index : -1;
      if (hit) {
        ring.state.hoverU = hit.u;
        ring.state.hoverV = hit.v;
      }
      sticky.classList.toggle('is-hovering', !!hit);
    },
    { passive: true }
  );

  const release = (e) => {
    if (!down) return;
    const wasDrag = dragged;
    down = null;
    dragged = false;
    ring.state.dragging = false;
    sticky.classList.remove('is-dragging');
    if (wasDrag) {
      // glide on, then settle
      gsap.to(ring.state, { drag: ring.state.drag + velocity * 14, duration: 1.2, ease: 'power3.out' });
      return;
    }
    if (e.type !== 'pointerup' || isControl(e.target) || !sticky.contains(e.target)) return;
    const hit = ring.pick(e.clientX, e.clientY);
    if (hit) {
      ring.state.hover = -1;
      sticky.classList.remove('is-hovering');
      lightbox.open(hit.index, ring.screenRect(hit.index));
    }
  };
  window.addEventListener('pointerup', release);
  window.addEventListener('pointercancel', release);
  sticky.addEventListener('pointerleave', () => {
    ring.state.hover = -1;
    sticky.classList.remove('is-hovering');
  });
}
