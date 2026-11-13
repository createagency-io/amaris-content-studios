/** Small DOM helpers shared by the section modules. */

export const qs = (sel, root = document) => root.querySelector(sel);
export const qsa = (sel, root = document) => [...root.querySelectorAll(sel)];

export const clamp = (v, min = 0, max = 1) => Math.min(max, Math.max(min, v));

/** Escape text before dropping it into an HTML template string. */
export const esc = (value) =>
  String(value).replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]);

/** html`<p>…</p>` → DocumentFragment */
export function fragment(markup) {
  const tpl = document.createElement('template');
  tpl.innerHTML = markup.trim();
  return tpl.content;
}

/**
 * Wraps every character of an element's text in a span so it can be animated.
 * Words stay together (no mid-word line breaks). Returns the character spans.
 */
export function splitChars(el) {
  const chars = [];
  const walk = (node) => {
    for (const child of [...node.childNodes]) {
      if (child.nodeType === Node.TEXT_NODE) {
        const frag = document.createDocumentFragment();
        for (const word of child.textContent.split(/(\s+)/)) {
          if (!word) continue;
          if (/^\s+$/.test(word)) {
            frag.append(' ');
            continue;
          }
          const w = document.createElement('span');
          w.className = 'word';
          for (const ch of word) {
            const c = document.createElement('span');
            c.className = 'char';
            c.textContent = ch;
            w.append(c);
            chars.push(c);
          }
          frag.append(w);
        }
        child.replaceWith(frag);
      } else if (child.nodeType === Node.ELEMENT_NODE) {
        walk(child);
      }
    }
  };
  walk(el);
  return chars;
}

export function debounce(fn, wait = 150) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  };
}

/** Inline SVG icons (stroke style, 24px grid). */
const ICONS = {
  whatsapp:
    '<path d="M12 3.2a8.7 8.7 0 0 0-7.4 13.3L3.5 20.6l4.2-1.1A8.7 8.7 0 1 0 12 3.2Z"/><path d="M8.9 8.3c-.3.9-.1 2 .9 3.3s2.3 2.3 3.8 2.8c.9.3 1.7-.1 2.1-.8l.2-.5-1.9-1-.8.8c-.9-.4-1.7-1.2-2.2-2.1l.8-.8-.9-1.9-.6.1c-.6.1-1.1.5-1.4 1.1Z" fill="currentColor" stroke="none"/>',
  instagram: '<rect x="3.5" y="3.5" width="17" height="17" rx="4.5"/><circle cx="12" cy="12" r="3.9"/><circle cx="17" cy="7" r=".9" fill="currentColor" stroke="none"/>',
  pin: '<path d="M12 21s-6.5-5.6-6.5-10.7a6.5 6.5 0 0 1 13 0C18.5 15.4 12 21 12 21Z"/><circle cx="12" cy="10.2" r="2.3"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  arrowUpRight: '<path d="M7 17 17 7M8 7h9v9"/>',
  close: '<path d="M6 6l12 12M18 6 6 18"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  mail: '<rect x="3" y="5.5" width="18" height="13" rx="2"/><path d="m3.5 7 8.5 6.5L20.5 7"/>',
  tiktok: '<path d="M14 4v10.5a3.5 3.5 0 1 1-3.5-3.5"/><path d="M14 4c.3 2.4 2 4.2 4.5 4.5"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  receipt: '<path d="M6.5 3.5h11v17l-2.75-1.8L12 20.5l-2.75-1.8L6.5 20.5Z"/><path d="M9.5 8.5h5M9.5 12h5"/>',
  calendar: '<rect x="3.5" y="5" width="17" height="15.5" rx="2"/><path d="M3.5 10h17M8 3.5v3M16 3.5v3"/><path d="m9.5 15 1.8 1.8 3.4-3.6"/>',
  armchair: '<path d="M6.5 11V7.5a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2V11"/><path d="M4 13a2 2 0 0 1 4 0v2h8v-2a2 2 0 0 1 4 0v4.5H4Z"/><path d="M6 17.5v2M18 17.5v2"/>',
  light: '<path d="M9 17.5h6M10 20.5h4"/><path d="M12 3.5a5.5 5.5 0 0 0-3.3 9.9c.5.4.8 1 .8 1.6h5c0-.6.3-1.2.8-1.6A5.5 5.5 0 0 0 12 3.5Z"/>',
  sparkle: '<path d="M12 3.5c.6 3.8 1.7 4.9 5.5 5.5-3.8.6-4.9 1.7-5.5 5.5-.6-3.8-1.7-4.9-5.5-5.5 3.8-.6 4.9-1.7 5.5-5.5Z"/><path d="M18 15.5c.3 1.7.8 2.2 2.5 2.5-1.7.3-2.2.8-2.5 2.5-.3-1.7-.8-2.2-2.5-2.5 1.7-.3 2.2-.8 2.5-2.5Z"/>',
  people: '<circle cx="9" cy="8.5" r="3"/><path d="M3.5 19.5c0-3 2.5-5 5.5-5s5.5 2 5.5 5"/><circle cx="17" cy="9.5" r="2.3"/><path d="M16.5 14.6c2.3.2 4 1.8 4 4.4"/>',
  hanger: '<path d="M12 8.5V7.8a2.1 2.1 0 1 0-2.1-2.1"/><path d="M12 8.5 3.5 15.2c-.8.6-.4 1.8.6 1.8h15.8c1 0 1.4-1.2.6-1.8Z"/>',
  heart: '<path d="M12 20s-7.5-4.5-7.5-10a4.2 4.2 0 0 1 7.5-2.6A4.2 4.2 0 0 1 19.5 10c0 5.5-7.5 10-7.5 10Z"/>',
  copy: '<rect x="8.5" y="8.5" width="11" height="11" rx="2"/><path d="M5.5 15.5h-.5a1.5 1.5 0 0 1-1.5-1.5V5A1.5 1.5 0 0 1 5 3.5h9A1.5 1.5 0 0 1 15.5 5v.5"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  expand: '<path d="M14 4h6v6M10 20H4v-6M20 4l-7 7M4 20l7-7"/>',
};

export function icon(name, { size = 22, label = '' } = {}) {
  const a11y = label ? `role="img" aria-label="${esc(label)}"` : 'aria-hidden="true"';
  return `<svg class="icon icon--${name}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" ${a11y}>${ICONS[name] || ''}</svg>`;
}
