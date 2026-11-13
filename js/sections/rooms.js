/**
 * 4. Rooms — the main feature. Renders one info card per room from the studio
 * data, then ties scroll to the 3D hallway (rooms.scene.js): the camera walks
 * through the three arches while each room's card, price and "Book this room"
 * button fade in as you arrive.
 */
import { gsap } from '../vendor.js?v=5';
import { qs, qsa, fragment, esc } from '../core/dom.js?v=5';
import { ROOMS, PHOTOS, naira, img, COUPLE_DURATION } from '../data/studio.js?v=5';

function roomCard(room, i) {
  const side = i % 2 === 0 ? 'right' : 'left'; // opposite the room's cover photo in 3D
  const media = room.photos
    .slice(0, 3)
    .map(
      (name) =>
        `<img src="${img(name, 800)}" alt="${esc(PHOTOS[name].alt)}" loading="lazy" decoding="async" width="800" height="${Math.round(800 / PHOTOS[name].ratio)}" />`
    )
    .join('');
  return `
    <article class="room-card" data-room="${room.id}" data-side="${side}" style="--accent: ${room.accent}">
      <div class="room-card__media">${media}</div>
      <div class="room-card__body">
        <p class="room-card__index">${room.index} <span>/ 0${ROOMS.length}</span></p>
        <h3 class="room-card__name display">${esc(room.name)} <em>Room</em></h3>
        <p class="room-card__tagline">${esc(room.tagline)}</p>
        <p class="room-card__desc">${esc(room.description)}</p>
        <ul class="room-card__tags">${room.bestFor.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>
        <div class="room-card__foot">
          <p class="room-card__price">
            <span class="eyebrow">Single user, per session</span>
            <strong>${naira(room.price.single)}</strong>
            <small>Couples ${naira(room.price.couple)} &middot; ${COUPLE_DURATION}</small>
          </p>
          <a class="btn btn--gold" href="#book" data-book='${JSON.stringify({ rooms: [room.id] })}'>Book this room</a>
        </div>
      </div>
    </article>`;
}

export async function initRooms({ env, stage, scroll }) {
  const section = qs('#rooms');
  qs('.rooms__cards', section).append(fragment(ROOMS.map(roomCard).join('')));
  const cards = qsa('.room-card', section);

  /* ---------- lite: stacked room features that fade in ---------- */
  if (env.lite || !stage) {
    if (!env.reducedMotion) {
      cards.forEach((card) => {
        gsap.from(card, {
          autoAlpha: 0,
          y: 60,
          duration: 1.3,
          ease: 'power3.out',
          scrollTrigger: { trigger: card, start: 'top 85%', once: true },
        });
      });
    }
    return;
  }

  /* ---------- full: the hallway ---------- */
  // the room signs are drawn with the brand fonts, so make sure they are in
  await Promise.race([
    Promise.all([document.fonts.load("300 64px 'Fraunces'"), document.fonts.load("500 22px 'Outfit'")]),
    new Promise((r) => setTimeout(r, 2500)),
  ]).catch(() => {});

  const { createRoomsScene } = await import('./rooms.scene.js?v=5');
  const hall = createRoomsScene({ stage, slot: qs('.stage-slot', section), rooms: ROOMS });

  const steps = qs('.rooms__steps', section);
  steps.append(
    fragment(
      ROOMS.map((r, i) => `<li><button type="button" data-step="${i}"><i>${r.index}</i>${esc(r.name)}</button></li>`).join('')
    )
  );
  const stepButtons = qsa('button', steps);

  let activeRoom = -1;
  let lastGrade = '';
  function sync(t) {
    // which room are we standing in?
    let current = -1;
    hall.marks.forEach((m, i) => {
      if (t >= m.in - 0.05) current = i;
    });
    if (current !== activeRoom) {
      activeRoom = current;
      stepButtons.forEach((b, i) => (i === current ? b.setAttribute('aria-current', 'true') : b.removeAttribute('aria-current')));
    }
    const hex = hall.gradeHex();
    if (hex !== lastGrade) {
      lastGrade = hex;
      section.style.setProperty('--grade', hex);
    }
  }

  const tl = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: {
      trigger: section,
      start: 'top top',
      end: 'bottom bottom',
      scrub: 0.8,
    },
    onUpdate: () => sync(hall.state.t),
  });

  tl.to(hall.state, { t: 1, duration: 1 }, 0)
    .to(qs('.rooms__intro', section), { autoAlpha: 0, y: -70, scale: 1.06, duration: 0.07, ease: 'power1.in' }, 0.035)
    .fromTo(steps, { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 0.04 }, 0.1)
    .to(steps, { autoAlpha: 0, y: 20, duration: 0.03 }, 0.93)
    .fromTo(qs('.rooms__veil', section), { opacity: 0 }, { opacity: 1, duration: 0.055 }, 0.945);

  cards.forEach((card, i) => {
    const m = hall.marks[i];
    tl.fromTo(card, { autoAlpha: 0, y: 70 }, { autoAlpha: 1, y: 0, duration: 0.05, ease: 'power2.out' }, m.in).to(
      card,
      { autoAlpha: 0, y: -50, duration: 0.035, ease: 'power2.in' },
      m.out
    );
  });

  // jump straight to a room
  stepButtons.forEach((btn, i) => {
    btn.addEventListener('click', () => {
      const st = tl.scrollTrigger;
      scroll.to(st.start + (st.end - st.start) * hall.marks[i].focus, { duration: 1.8 });
    });
  });
}
