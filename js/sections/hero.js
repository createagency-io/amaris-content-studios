/**
 * 2. Hero — "Create. Capture. Inspire."
 * Intro: the three lines rise out of their masks as the loader doors open.
 * Scroll: the lines split apart and parallax away while the camera pushes
 * through the 3D doorway (hero.scene.js).
 */
import { gsap } from '../vendor.js';
import { qs, qsa, splitChars } from '../core/dom.js';

export async function initHero({ env, stage }) {
  const section = qs('#home');
  const lines = qsa('.hero__line', section);
  const chars = lines.map((line) => splitChars(line));
  const eyebrow = qs('.hero__eyebrow span', section);
  const subItems = [qs('.hero__lede', section), qs('.hero__cta', section)];
  const hint = qs('.hero__hint', section);

  let ready = Promise.resolve();

  /* ---------- hide everything the intro will bring in ---------- */
  if (!env.reducedMotion) {
    gsap.set(chars.flat(), { yPercent: 118 });
    gsap.set([eyebrow, ...subItems], { autoAlpha: 0, y: 26 });
    gsap.set(hint, { autoAlpha: 0 });
  } else {
    lines.forEach((l) => l.classList.add('is-in'));
  }

  /* ---------- 3D doorway + scroll choreography ---------- */
  if (!env.lite && stage) {
    const { createHeroScene } = await import('./hero.scene.js');
    const scene3d = createHeroScene({ stage, slot: qs('.stage-slot', section) });
    ready = scene3d.ready;

    const tl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: { trigger: section, start: 'top top', end: 'bottom bottom', scrub: 0.7 },
    });

    tl.to(scene3d.state, { progress: 1, duration: 1 }, 0)
      // the headline splits: each line leaves in its own direction, at its own speed
      .to(lines[0], { x: '-14vw', y: '-12vh', opacity: 0, duration: 0.17, ease: 'power1.in' }, 0.015)
      .to(lines[1], { x: '20vw', y: '-5vh', opacity: 0, duration: 0.19, ease: 'power1.in' }, 0.03)
      .to(lines[2], { x: '-6vw', y: '-26vh', scale: 1.2, opacity: 0, duration: 0.2, ease: 'power1.in' }, 0.045)
      .to(qs('.hero__eyebrow', section), { opacity: 0, y: -30, duration: 0.07 }, 0)
      .to(qs('.hero__sub', section), { opacity: 0, y: -50, duration: 0.09 }, 0)
      .to(hint, { opacity: 0, duration: 0.05 }, 0)
      .to(qs('.hero__scrim', section), { opacity: 0.35, duration: 0.25 }, 0.02)
      // a second beat, deep inside the doorway
      .fromTo(
        qs('.hero__interlude', section),
        { autoAlpha: 0, y: 60 },
        { autoAlpha: 1, y: 0, duration: 0.1, ease: 'power2.out' },
        0.36
      )
      .to(qs('.hero__interlude', section), { autoAlpha: 0, y: -60, duration: 0.09, ease: 'power2.in' }, 0.62)
      // into the light, then hand over to the next section
      .fromTo(qs('.hero__veil', section), { opacity: 0 }, { opacity: 1, duration: 0.1 }, 0.9);
  } else {
    const fallback = qs('.hero__fallback img', section);
    if (fallback && !fallback.complete) {
      ready = new Promise((resolve) => {
        fallback.addEventListener('load', resolve, { once: true });
        fallback.addEventListener('error', resolve, { once: true });
      });
    }
  }

  return {
    ready,

    /** Played once, as the loader doors part. */
    intro() {
      if (env.reducedMotion) return;
      const tl = gsap.timeline({ delay: 0.25 });
      lines.forEach((line, i) => {
        tl.to(
          chars[i],
          {
            yPercent: 0,
            duration: 1.5,
            ease: 'power4.out',
            stagger: 0.035,
            onComplete: () => line.classList.add('is-in'),
          },
          0.14 * i
        );
      });
      tl.to(eyebrow, { autoAlpha: 1, y: 0, duration: 1.1, ease: 'power3.out' }, 0.5)
        .to(subItems, { autoAlpha: 1, y: 0, duration: 1.2, ease: 'power3.out', stagger: 0.12 }, 0.75)
        .to(hint, { autoAlpha: 1, duration: 1 }, 1.3);

      if (!env.lite) return;
      // lite mode still gets a gentle entrance for the arch photo
      gsap.from(qs('.hero__fallback-arch', section), { y: 60, autoAlpha: 0, duration: 1.6, ease: 'power3.out' });
    },
  };
}
