/**
 * 9. Contact + footer — the giant AS mark catches the light as it scrolls in
 * and leans towards the cursor; the floating WhatsApp button appears once the
 * visitor is past the hero.
 */
import { gsap, ScrollTrigger } from '../vendor.js?v=5';
import { qs, qsa } from '../core/dom.js?v=5';
import { pointer } from '../core/pointer.js?v=5';

export function initContact({ env }) {
  const section = qs('#contact');
  const mark = qs('.contact__mark', section);
  const wrap = qs('.contact__mark-wrap', section);

  for (const el of qsa('[data-year]')) el.textContent = String(new Date().getFullYear());

  /* ---- floating WhatsApp button: after the hero, away from the contact block ---- */
  const fab = qs('.wa-fab');
  const hero = qs('#home');
  let pastHero = false;
  let atEnd = false;
  const immersive = new Set(); // full-screen 3D sections currently pinned
  const syncFab = () => fab.classList.toggle('is-visible', pastHero && !atEnd && immersive.size === 0);
  if (!env.lite) {
    for (const id of ['#rooms', '#gallery']) {
      ScrollTrigger.create({
        trigger: qs(id),
        start: 'top 40%',
        end: 'bottom 60%',
        onToggle: (self) => {
          if (self.isActive) immersive.add(id);
          else immersive.delete(id);
          syncFab();
        },
      });
    }
  }
  ScrollTrigger.create({
    trigger: hero,
    start: 'bottom 60%',
    end: 'max',
    onToggle: (self) => {
      pastHero = self.isActive;
      syncFab();
    },
  });
  ScrollTrigger.create({
    trigger: qs('#book'),
    start: 'top 70%',
    end: 'max',
    onToggle: (self) => {
      atEnd = self.isActive;
      syncFab();
    },
  });

  if (env.reducedMotion) return;

  /* ---- the mark: scales up and the gold sheen sweeps across as it enters ---- */
  gsap.fromTo(
    mark,
    { scale: 0.72, '--sheen': '0%' },
    {
      scale: 1,
      '--sheen': '100%',
      ease: 'none',
      scrollTrigger: { trigger: wrap, start: 'top bottom', end: 'bottom 35%', scrub: 0.8 },
    }
  );

  let visible = false;
  ScrollTrigger.create({ trigger: section, start: 'top bottom', end: 'bottom top', onToggle: (self) => (visible = self.isActive) });
  const rotX = gsap.quickSetter(mark, 'rotationX', 'deg');
  const rotY = gsap.quickSetter(mark, 'rotationY', 'deg');
  gsap.ticker.add(() => {
    if (!visible) return;
    rotY(pointer.sx * 16);
    rotX(-pointer.sy * 10);
  });
}
