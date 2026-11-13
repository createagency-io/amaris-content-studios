/**
 * Amaris Content Studios — entry point.
 *
 * Boot order:
 *   1. work out what the device can do (core/env.js)
 *   2. start smooth scroll + shared pointer input
 *   3. create the single WebGL stage (skipped in lite mode)
 *   4. initialise every section module (one file per section in /sections)
 *   5. when the hero is ready, swing the loader doors open
 */
import { gsap, ScrollTrigger } from './vendor.js';
import { env, downgradeToLite } from './core/env.js';
import { initScroll } from './core/scroll.js';
import { initPointer } from './core/pointer.js';
import { qsa, icon } from './core/dom.js';

import { initLoader } from './sections/loader.js';
import { initNav } from './sections/nav.js';
import { initHero } from './sections/hero.js';
import { initAbout } from './sections/about.js';
import { initRooms } from './sections/rooms.js';
import { initGallery } from './sections/gallery.js';
import { initPricing } from './sections/pricing.js';
import { initRules } from './sections/rules.js';
import { initBooking } from './sections/booking.js';
import { initContact } from './sections/contact.js';

const root = document.documentElement;

/** Swap every <span data-icon="name"> for its inline SVG. */
function hydrateIcons(scope = document) {
  for (const el of qsa('[data-icon]', scope)) {
    el.innerHTML = icon(el.dataset.icon, { size: Number(el.dataset.size) || 20 });
    el.classList.add('icon-wrap');
  }
}

/** Fade-up for anything marked data-reveal, as it enters the viewport. */
function initReveals() {
  const items = qsa('[data-reveal]');
  if (env.reducedMotion) {
    root.classList.add('reveals-off');
    return;
  }
  ScrollTrigger.batch(items, {
    start: 'top 88%',
    once: true,
    onEnter: (batch) =>
      gsap.to(batch, {
        opacity: 1,
        y: 0,
        duration: 1.2,
        ease: 'power3.out',
        stagger: 0.09,
        overwrite: true,
        clearProps: 'transform',
      }),
  });
}

async function createStageSafely() {
  if (env.lite) return null;
  try {
    const { createStage } = await import('./core/stage.js');
    return createStage(env);
  } catch (err) {
    console.warn('[amaris] WebGL unavailable, using the lite experience.', err);
    downgradeToLite();
    return null;
  }
}

async function boot() {
  root.classList.add(env.lite ? 'lite' : 'full');
  root.classList.add(env.tier === 'low' ? 'tier-low' : 'tier-high');
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

  hydrateIcons();

  const scroll = initScroll(env);
  initPointer(env);

  const ctx = { env, scroll, stage: null };
  const loader = initLoader(ctx);

  ctx.stage = await createStageSafely();

  initNav(ctx);
  const hero = await initHero(ctx);

  // everything below the fold can finish setting up behind the loader
  const sections = [initAbout, initRooms, initGallery, initPricing, initRules, initBooking, initContact];
  await Promise.all(
    sections.map(async (init) => {
      try {
        await init(ctx);
      } catch (err) {
        console.error(`[amaris] ${init.name} failed`, err);
      }
    })
  );

  hydrateIcons();
  initReveals();

  await Promise.race([Promise.all([hero.ready, document.fonts?.ready]), new Promise((r) => setTimeout(r, 5000))]);
  ScrollTrigger.refresh();

  // deep links (#pricing etc.) are honoured once the doors are open
  const target = window.location.hash && document.querySelector(window.location.hash);
  if (target) scroll.to(target, { immediate: true });

  await loader.open(() => hero.intro());
  clearTimeout(window.__loaderFailsafe);

  // late layout shifts (fonts, images) should never leave triggers stale
  window.addEventListener('load', () => ScrollTrigger.refresh(), { once: true });
}

boot().catch((err) => {
  console.error('[amaris] boot failed', err);
  // never trap a visitor behind the loader
  root.classList.remove('full');
  root.classList.add('lite', 'loader-skip', 'reveals-off');
  root.classList.remove('is-locked');
});
