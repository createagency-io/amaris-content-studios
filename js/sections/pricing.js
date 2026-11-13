/**
 * 6. Pricing — tabs for Single / Couple / Family-Group. Each tab is a deck of
 * four sticky cards: a card pins under the previous one, then flips from its
 * photo face to its price face as you keep scrolling.
 */
import { gsap, ScrollTrigger } from '../vendor.js';
import { qs, qsa, fragment, esc, clamp } from '../core/dom.js';
import { PRICING, PRICING_NOTES, PACKAGES, PHOTOS, naira, img } from '../data/studio.js';

const TAB_ORDER = ['single', 'couple', 'group'];
const pad = (n) => String(n).padStart(2, '0');
const bookAttr = (book) => `data-book='${JSON.stringify(book)}'`;

function cardBack(card) {
  if (card.kind === 'combo') {
    return `
      <div class="pcard__body">
        <p class="eyebrow">${esc(card.eyebrow)}</p>
        <div class="pcard__rows">
          ${card.rows
            .map(
              (row) => `
            <div class="pcard__row">
              <span class="pcard__row-label">${esc(row.label)}${row.note ? `<small>${esc(row.note)}</small>` : ''}</span>
              <span class="pcard__row-price">${naira(row.price)}</span>
              <a href="#book" ${bookAttr(row.book)}>Book this combo</a>
            </div>`
            )
            .join('')}
        </div>
      </div>`;
  }
  return `
    <div class="pcard__body">
      <p class="eyebrow">${esc(card.eyebrow)}</p>
      <p class="pcard__price display">${naira(card.price)}</p>
      <ul class="pcard__points">${card.points.map((p) => `<li>${esc(p)}</li>`).join('')}</ul>
      <a class="btn btn--gold btn--sm" href="#book" ${bookAttr(card.book)}>Book this</a>
      <img class="pcard__thumb" src="${img(card.photo, 480)}" alt="" loading="lazy" decoding="async" width="480" height="640" />
    </div>`;
}

function cardMarkup(card, i) {
  const priceTag = card.kind === 'combo' ? `from ${naira(Math.min(...card.rows.map((r) => r.price)))}` : naira(card.price);
  return `
    <article class="pcard" style="--i: ${i}">
      <div class="pcard__inner">
        <div class="pcard__face pcard__face--front" aria-hidden="true">
          <img src="${img(card.photo, 800)}" srcset="${img(card.photo, 480)} 480w, ${img(card.photo, 800)} 800w" sizes="(min-width: 1024px) 46vw, 92vw" alt="" loading="lazy" decoding="async" width="800" height="${Math.round(800 / PHOTOS[card.photo].ratio)}" />
          <div class="pcard__strip">
            <span class="pcard__no">${pad(i + 1)}</span>
            <span class="pcard__title">${esc(card.title)}</span>
            <span class="pcard__tag">Scroll to flip</span>
          </div>
          <p class="pcard__line display">${esc(card.line)}</p>
        </div>
        <div class="pcard__face pcard__face--back">
          <div class="pcard__strip">
            <span class="pcard__no">${pad(i + 1)}</span>
            <h3 class="pcard__title">${esc(card.title)}</h3>
            <span class="pcard__tag pcard__tag--price">${priceTag}</span>
          </div>
          ${cardBack(card)}
        </div>
      </div>
    </article>`;
}

export function initPricing({ env, scroll }) {
  const section = qs('#pricing');
  const tabsEl = qs('.pricing__tabs', section);
  const panelsEl = qs('.pricing__panels', section);

  /* ---------- render ---------- */
  tabsEl.append(
    fragment(
      TAB_ORDER.map(
        (id, i) =>
          `<button class="pricing__tab" type="button" role="tab" id="ptab-${id}" aria-controls="ppanel-${id}" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}" data-tab="${id}">${esc(PACKAGES[id].label)}</button>`
      ).join('')
    )
  );
  panelsEl.append(
    fragment(
      TAB_ORDER.map(
        (id, i) => `
        <div class="pricing__panel" role="tabpanel" id="ppanel-${id}" aria-labelledby="ptab-${id}" data-panel="${id}" ${i === 0 ? '' : 'hidden'}>
          <div class="stack">${PRICING[id].map(cardMarkup).join('')}</div>
        </div>`
      ).join('')
    )
  );
  qs('.pricing__notes', section).append(
    fragment(PRICING_NOTES.map((n) => `<li><strong>${esc(n.title)}</strong><span>${esc(n.text)}</span></li>`).join(''))
  );

  const tabs = qsa('.pricing__tab', section);
  const panels = qsa('.pricing__panel', section);

  /* ---------- the flip ---------- */
  // very short screens (landscape phones) can't fit a stacked deck: show plain cards there
  const shortScreen = window.matchMedia('(max-height: 600px)');
  const flat = () => env.lite || shortScreen.matches;
  let deck = null;

  function buildDeck() {
    deck?.kill();
    deck = null;
    section.classList.toggle('is-flat', flat());
    const panel = panels.find((p) => !p.hidden);
    const inners = qsa('.pcard__inner', panel);
    if (flat()) {
      gsap.set(inners, { clearProps: 'transform' });
      return;
    }
    const stack = qs('.stack', panel);
    const cards = qsa('.pcard', panel);
    const ease = gsap.parseEase('power2.inOut');
    let metrics = null;

    const measure = () => {
      const cs = getComputedStyle(cards[0]);
      const cardH = cards[0].offsetHeight;
      const gap = parseFloat(cs.marginBottom) || window.innerHeight * 0.46;
      const strip = parseFloat(getComputedStyle(section).getPropertyValue('--strip-h')) || 56;
      metrics = {
        stackTop: parseFloat(cs.top) || 0,
        // scroll distance between one card pinning and the next one pinning
        pitch: cardH + gap - strip,
        // the flip happens while the card is pinned and still fully uncovered
        flip: gap * 0.82,
      };
    };

    deck = ScrollTrigger.create({
      trigger: stack,
      start: () => {
        measure();
        return `top ${metrics.stackTop}px`;
      },
      end: () => `+=${metrics.pitch * (cards.length - 1) + metrics.flip + 40}`,
      invalidateOnRefresh: true,
      onRefresh: (self) => render(self),
      onUpdate: (self) => render(self),
    });

    function render(self) {
      if (!metrics) measure();
      const scrolled = self.scroll() - self.start;
      inners.forEach((inner, i) => {
        const t = ease(clamp((scrolled - i * metrics.pitch - metrics.flip * 0.08) / (metrics.flip * 0.84)));
        // lift slightly mid-flip so the card clears its neighbours
        const lift = Math.sin(t * Math.PI);
        gsap.set(inner, { rotationY: 180 * t, z: lift * 46, scale: 1 - lift * 0.035 });
      });
    }
    render(deck);
  }

  /* ---------- tabs ---------- */
  function select(id, { focus = false } = {}) {
    tabs.forEach((tab) => {
      const on = tab.dataset.tab === id;
      tab.setAttribute('aria-selected', String(on));
      tab.tabIndex = on ? 0 : -1;
      if (on && focus) tab.focus();
    });
    panels.forEach((panel) => (panel.hidden = panel.dataset.panel !== id));
    buildDeck();
    ScrollTrigger.refresh();

    // if the reader is already deep in the deck, bring the new deck's first card back into view
    const panel = panels.find((p) => !p.hidden);
    const top = panel.getBoundingClientRect().top;
    if (top < 0) {
      const offset = -(parseFloat(getComputedStyle(qs('.pcard', panel)).top) || 120) - 12;
      scroll.to(panel, { offset, duration: 0.9 });
    }
    if (!env.reducedMotion) {
      gsap.fromTo(qsa('.pcard', panel), { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 0.7, ease: 'power3.out', stagger: 0.06, clearProps: 'opacity,visibility,transform' });
    }
  }

  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => select(tab.dataset.tab));
    tab.addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      e.preventDefault();
      const next = tabs[(i + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length];
      select(next.dataset.tab, { focus: true });
    });
  });

  buildDeck();
  shortScreen.addEventListener('change', () => {
    buildDeck();
    ScrollTrigger.refresh();
  });
}
