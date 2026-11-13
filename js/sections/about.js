/**
 * 3. About — photo cards drift at different depths and the whole cloud tilts
 * with the cursor. On phones it follows the gyroscope instead (iOS asks first).
 */
import { gsap, ScrollTrigger } from '../vendor.js?v=5';
import { qs, qsa } from '../core/dom.js?v=5';
import { pointer, requestGyro, gyroNeedsPermission } from '../core/pointer.js?v=5';

export function initAbout({ env }) {
  const section = qs('#about');
  const cloud = qs('[data-cloud]', section);
  const inner = qs('.about__cloud-inner', cloud);
  const cards = qsa('.acard', cloud);
  if (env.reducedMotion) return;

  /* ---- cards arrive one by one ---- */
  gsap.from(cards, {
    autoAlpha: 0,
    scale: 0.82,
    y: 80,
    duration: 1.5,
    ease: 'power3.out',
    stagger: 0.12,
    scrollTrigger: { trigger: cloud, start: 'top 82%', once: true },
  });

  /* ---- each card drifts on its own slow loop ---- */
  cards.forEach((card, i) => {
    const drift = qs('.acard__drift', card);
    gsap.to(drift, {
      y: i % 2 ? 16 : -14,
      x: i % 2 ? -7 : 8,
      rotation: i % 2 ? 1.4 : -1.2,
      duration: 4.6 + i * 0.9,
      ease: 'sine.inOut',
      yoyo: true,
      repeat: -1,
      delay: -i * 1.3,
    });
  });

  /* ---- scroll parallax: nearer cards travel further ---- */
  cards.forEach((card) => {
    const depth = Number(card.dataset.depth) || 1;
    gsap.fromTo(
      qs('.acard__par', card),
      { y: 90 * depth },
      {
        y: -90 * depth,
        ease: 'none',
        scrollTrigger: { trigger: cloud, start: 'top bottom', end: 'bottom top', scrub: 0.6 },
      }
    );
  });

  /* ---- tilt with cursor / gyro, only while on screen ---- */
  let visible = false;
  ScrollTrigger.create({
    trigger: cloud,
    start: 'top bottom',
    end: 'bottom top',
    onToggle: (self) => (visible = self.isActive),
  });
  const rotX = gsap.quickSetter(inner, 'rotationX', 'deg');
  const rotY = gsap.quickSetter(inner, 'rotationY', 'deg');
  gsap.ticker.add(() => {
    if (!visible) return;
    rotY(pointer.sx * 11);
    rotX(-pointer.sy * 8);
  });

  /* ---- iOS: one tap to allow motion ---- */
  const gyroBtn = qs('.about__gyro', cloud);
  if (env.coarse && gyroNeedsPermission()) {
    gyroBtn.hidden = false;
    gyroBtn.addEventListener('click', async () => {
      const granted = await requestGyro();
      if (granted) gyroBtn.hidden = true;
      else gyroBtn.textContent = 'Motion access was not allowed';
    });
  }
}
