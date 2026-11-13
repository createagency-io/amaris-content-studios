/**
 * 8. Book Now — pick a package, room(s) and date. The booking pass on the
 * right updates live with an estimate and the exact WhatsApp message, and the
 * send button opens WhatsApp with that message pre-filled to the studio.
 */
import { gsap } from '../vendor.js?v=5';
import { qs, qsa, fragment, esc, icon } from '../core/dom.js?v=5';
import { pointer } from '../core/pointer.js?v=5';
import { ROOMS, GROUPS, PACKAGES, STUDIO, quote, naira, img, waLink, roomById, COUPLE_DURATION } from '../data/studio.js?v=5';

const HINTS = {
  single: 'Choose one room, or combine two or three for more looks in one visit.',
  couple: `One room is ${COUPLE_DURATION}. Two rooms run 2 hours, all three run 3 hours.`,
  group: 'Family and group sessions are held in a single room. Pick the one that suits you.',
};

const listRooms = (ids) => {
  const names = ids.map((id) => `${roomById(id).name} Room`);
  if (names.length <= 1) return names[0] || '';
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
};

function formatDate(value) {
  if (!value) return '';
  const [y, m, d] = value.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

function formatTime(value) {
  if (!value) return '';
  const [h, min] = value.split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  return `${((h + 11) % 12) + 1}:${String(min).padStart(2, '0')} ${suffix}`;
}

export function initBooking({ env }) {
  const form = qs('#booking-form');
  const roompick = qs('[data-roompick]', form);
  const sizeSelect = form.elements.size;
  const dateInput = form.elements.date;
  const ticket = (key) => qs(`[data-ticket="${key}"]`);
  const sendBtn = ticket('send');
  const copyBtn = ticket('copy');
  const sendLabel = qs('[data-send-label]', sendBtn);
  let touched = false; // errors only show after the visitor has tried to send

  /* ---------- render the dynamic parts ---------- */
  roompick.append(
    fragment(
      ROOMS.map(
        (room) => `
        <label class="roompick__item">
          <input type="checkbox" name="room" value="${room.id}" />
          <span class="roompick__card">
            <img src="${img(room.cover, 480)}" alt="" loading="lazy" decoding="async" width="480" height="640" />
            <span class="roompick__check">${icon('check', { size: 15 })}</span>
            <span class="roompick__text">
              <span class="roompick__name">${esc(room.name)}</span>
              <span class="roompick__price" data-room-price="${room.id}"></span>
            </span>
          </span>
        </label>`
      ).join('')
    )
  );
  sizeSelect.append(
    fragment(GROUPS.map((g) => `<option value="${g.id}">${esc(g.label)} · ${g.duration} · ${naira(g.price)}</option>`).join(''))
  );

  // no past dates
  const now = new Date();
  dateInput.min = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  const roomInputs = qsa('input[name="room"]', form);

  /* ---------- state ---------- */
  const read = () => ({
    pkg: form.elements.pkg.value,
    rooms: roomInputs.filter((i) => i.checked).map((i) => i.value),
    size: sizeSelect.value,
    extra: form.elements.extra.value,
    date: dateInput.value,
    time: form.elements.time.value,
    name: form.elements.name.value.trim(),
    notes: form.elements.notes.value.trim(),
  });

  function buildMessage(sel, q) {
    const lines = [`Hello ${STUDIO.name}! I'd like to book a session.`, ''];
    lines.push(`Package: ${q ? q.label : PACKAGES[sel.pkg].long}`);
    if (sel.rooms.length) lines.push(`${sel.rooms.length > 1 ? 'Rooms' : 'Room'}: ${listRooms(sel.rooms)}`);
    if (q?.duration) lines.push(`Session length: ${q.duration}`);
    if (sel.date) lines.push(`Date: ${formatDate(sel.date)}`);
    if (sel.time) lines.push(`Preferred time: ${formatTime(sel.time)}`);
    if (sel.extra === '30') lines.push(`Extra time: 30 minutes (+${naira(q ? q.addOn : 19000)})`);
    if (sel.extra === '60') lines.push('Extra time: 1 full hour (with the ₦10,000 extra-hour discount)');
    if (q) lines.push(`Estimated total: ${naira(q.total)}${q.extraHour ? ' plus the extra hour' : ''}`);
    if (sel.name) lines.push(`Name: ${sel.name}`);
    if (sel.notes) lines.push('', `Notes: ${sel.notes}`);
    const pay = STUDIO.payment;
    lines.push('', 'Payment details:', `Account number: ${pay.account}`, `Bank: ${pay.bank}`, `Account name: ${pay.name}`);
    lines.push('', 'Please confirm availability and I will send payment to this account. Thank you!');
    return lines.join('\n');
  }

  let message = '';
  const shownTotal = { value: 0 };

  function update() {
    const sel = read();
    const group = sel.pkg === 'group';

    // group sessions use one room; other packages can combine them
    if (group && sel.rooms.length > 1) {
      roomInputs.forEach((input) => (input.checked = input.value === sel.rooms[sel.rooms.length - 1]));
      sel.rooms = [sel.rooms[sel.rooms.length - 1]];
    }

    qs('[data-group-only]', form).hidden = !group;
    qs('[data-pkg-blurb]', form).textContent = PACKAGES[sel.pkg].blurb;
    qs('[data-room-hint]', form).textContent = HINTS[sel.pkg];
    for (const room of ROOMS) {
      qs(`[data-room-price="${room.id}"]`, form).textContent = group ? 'Any group size' : naira(room.price[sel.pkg]);
    }

    const q = quote(sel);

    // ticket
    const setRow = (key, value, fallback) => {
      const el = ticket(key);
      el.textContent = value || fallback;
      el.classList.toggle('is-empty', !value);
    };
    setRow('pkg', q ? q.label : PACKAGES[sel.pkg].long);
    setRow('rooms', listRooms(sel.rooms), 'Not chosen yet');
    setRow('date', [formatDate(sel.date), formatTime(sel.time)].filter(Boolean).join(' at '), 'Not chosen yet');
    const extraLabel = sel.extra === '30' ? ' + 30 minutes' : sel.extra === '60' ? ' + 1 hour' : '';
    setRow('duration', q ? `${q.duration || 'One session'}${extraLabel}` : '', 'Choose a room first');
    ticket('title').textContent = sel.rooms.length ? listRooms(sel.rooms) : 'Your session';

    const total = q ? q.total : 0;
    const totalEl = ticket('total');
    totalEl.classList.toggle('is-empty', !q);
    if (!q) {
      // no room yet: no fake ₦0, just a dash until there is something to price
      gsap.killTweensOf(shownTotal);
      shownTotal.value = 0;
      totalEl.textContent = '—';
    } else if (env.reducedMotion) totalEl.textContent = naira(total);
    else {
      gsap.to(shownTotal, {
        value: total,
        duration: 0.6,
        ease: 'power2.out',
        overwrite: true,
        onUpdate: () => (ticket('total').textContent = naira(Math.round(shownTotal.value / 500) * 500)),
        onComplete: () => (ticket('total').textContent = naira(total)),
      });
    }
    ticket('note').textContent = !q
      ? 'Pick a room to see your price.'
      : q.extraHour
      ? `Plus your extra hour, with ${naira(10000)} off. The studio confirms the final total on WhatsApp.`
      : sel.extra === '30'
        ? `Includes ${naira(q.addOn)} for the extra 30 minutes. Final total is confirmed on WhatsApp.`
        : 'Final total is confirmed by the studio on WhatsApp.';

    message = buildMessage(sel, q);
    ticket('message').textContent = message;

    // the button only becomes a real WhatsApp link once a room and a date are chosen
    const ready = sel.rooms.length > 0 && !!sel.date;
    sendBtn.href = ready ? waLink(message) : '#book';
    sendBtn.setAttribute('aria-disabled', String(!ready));
    sendBtn.classList.toggle('is-waiting', !ready);
    sendLabel.textContent = ready ? 'Send on WhatsApp' : !sel.rooms.length ? 'Choose a room first' : 'Choose a date first';
    copyBtn.disabled = !ready;

    if (touched) validate(sel);
    return sel;
  }

  function validate(sel = read()) {
    const missingRoom = !sel.rooms.length;
    const missingDate = !sel.date;
    qs('[data-error="rooms"]', form).hidden = !missingRoom;
    qs('[data-error="date"]', form).hidden = !missingDate;
    dateInput.setAttribute('aria-invalid', String(missingDate));
    return { ok: !missingRoom && !missingDate, missingRoom, missingDate };
  }

  form.addEventListener('input', update);
  form.addEventListener('change', update);
  form.addEventListener('submit', (e) => e.preventDefault());

  /* ---------- send / copy ---------- */
  sendBtn.addEventListener('click', (e) => {
    touched = true;
    const result = validate(update());
    if (result.ok) return; // the link opens WhatsApp with the message
    e.preventDefault();
    e.stopImmediatePropagation(); // keep the smooth-scroll "#book" handler out of it
    const target = result.missingRoom ? roompick : dateInput;
    target.scrollIntoView({ block: 'center', behavior: env.reducedMotion ? 'auto' : 'smooth' });
    if (!result.missingRoom) dateInput.focus({ preventScroll: true });
    if (!env.reducedMotion) gsap.fromTo(target, { x: -8 }, { x: 0, duration: 0.5, ease: 'elastic.out(1, 0.35)' });
  });

  copyBtn.addEventListener('click', async () => {
    const label = qs('[data-copy-label]', copyBtn);
    try {
      await navigator.clipboard.writeText(message);
      label.textContent = 'Copied';
    } catch {
      // clipboard blocked: select the text so it can be copied by hand
      const range = document.createRange();
      range.selectNodeContents(ticket('message'));
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
      label.textContent = 'Press copy';
    }
    setTimeout(() => (label.textContent = 'Copy message'), 2200);
  });

  /* ---------- payment details: filled from studio.js, one-tap copy of the account number ---------- */
  for (const key of ['account', 'bank', 'name']) {
    const el = qs(`[data-pay="${key}"]`);
    if (el) el.textContent = STUDIO.payment[key];
  }
  const payCopy = qs('[data-pay-copy]');
  payCopy?.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(STUDIO.payment.account);
      payCopy.textContent = 'Copied';
    } catch {
      const range = document.createRange();
      range.selectNodeContents(qs('[data-pay="account"]'));
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
      payCopy.textContent = 'Selected';
    }
    setTimeout(() => (payCopy.textContent = 'Copy'), 2000);
  });

  /* ---------- pre-fill from "Book this room" buttons elsewhere on the page ---------- */
  window.addEventListener('amaris:book', (e) => {
    const { pkg, rooms, size, count } = e.detail || {};
    if (pkg && form.elements.pkg.value !== pkg) form.elements.pkg.value = pkg;
    if (size) sizeSelect.value = size;
    if (Array.isArray(rooms)) roomInputs.forEach((input) => (input.checked = rooms.includes(input.value)));
    else if (count) {
      // "any two rooms": keep what is already ticked, the visitor chooses the rest
      const ticked = roomInputs.filter((i) => i.checked);
      ticked.slice(count).forEach((input) => (input.checked = false));
    }
    update();
  });

  /* ---------- the pass tilts gently towards the cursor ---------- */
  const card = qs('.ticket__card');
  if (env.hover && !env.reducedMotion) {
    let active = false;
    new IntersectionObserver(([entry]) => (active = entry.isIntersecting)).observe(card);
    const rotX = gsap.quickSetter(card, 'rotationX', 'deg');
    const rotY = gsap.quickSetter(card, 'rotationY', 'deg');
    gsap.ticker.add(() => {
      if (!active) return;
      rotY(pointer.sx * 5);
      rotX(-pointer.sy * 3.5);
    });
  }

  update();
}
