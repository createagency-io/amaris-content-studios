/**
 * 7. Rules — an accessible accordion. One rule open at a time; the open/close
 * motion is pure CSS (grid-template-rows), this file only manages state.
 */
import { qs, qsa, fragment, esc, icon } from '../core/dom.js?v=5';
import { RULES } from '../data/studio.js?v=5';

const pad = (n) => String(n).padStart(2, '0');

export function initRules() {
  const list = qs('.rules__list');
  list.append(
    fragment(
      RULES.map(
        (rule, i) => `
        <div class="rule${i === 0 ? ' is-open' : ''}" data-reveal>
          <h3>
            <button class="rule__btn" type="button" id="rule-btn-${i}" aria-expanded="${i === 0}" aria-controls="rule-panel-${i}">
              <span class="rule__icon">${icon(rule.icon, { size: 22 })}</span>
              <span class="rule__label"><span class="rule__no">${pad(i + 1)}</span><span class="rule__title">${esc(rule.title)}</span></span>
              <span class="rule__chev" aria-hidden="true"></span>
            </button>
          </h3>
          <div class="rule__panel" id="rule-panel-${i}" role="region" aria-labelledby="rule-btn-${i}">
            <div><p>${esc(rule.text)}</p></div>
          </div>
        </div>`
      ).join('')
    )
  );

  const rules = qsa('.rule', list);
  const setOpen = (rule, open) => {
    rule.classList.toggle('is-open', open);
    qs('.rule__btn', rule).setAttribute('aria-expanded', String(open));
    // closed panels are taken out of the tab order and the accessibility tree
    qs('.rule__panel', rule).toggleAttribute('inert', !open);
  };
  rules.forEach((rule, i) => setOpen(rule, i === 0));

  list.addEventListener('click', (e) => {
    const btn = e.target.closest('.rule__btn');
    if (!btn) return;
    const rule = btn.closest('.rule');
    const willOpen = !rule.classList.contains('is-open');
    rules.forEach((r) => setOpen(r, r === rule && willOpen));
  });
}
