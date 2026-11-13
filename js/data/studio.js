/**
 * Single source of truth for everything the studio says about itself:
 * contact details, rooms, photos, prices and house rules.
 * Change a price or a caption here and every section picks it up.
 */

export const STUDIO = {
  name: 'Amaris Content Studios',
  tagline: 'Create. Capture. Inspire.',
  whatsapp: '2348034750928',
  phoneDisplay: '+234 803 475 0928',
  instagram: 'amarisstudio_ng',
  tiktok: 'amarisstudios.ng',
  email: 'contact@theamarisstudio.com',
  address: 'Zanna Estate, along Benin–Auchi Expressway, Ekpoma, Edo State, Nigeria',
  maps: 'https://www.google.com/maps/search/?api=1&query=Zanna+Estate%2C+Benin-Auchi+Expressway%2C+Ekpoma%2C+Edo+State%2C+Nigeria',
};

/** WhatsApp deep link with an optional prefilled message. */
export const waLink = (text = '') =>
  `https://wa.me/${STUDIO.whatsapp}${text ? `?text=${encodeURIComponent(text)}` : ''}`;

/** ₦35,000 */
export const naira = (n) => `₦${Number(n).toLocaleString('en-NG')}`;

/** Path to an optimised photo. Widths available: 480, 800, 1600. */
export const img = (name, width = 800) => `assets/img/${name}-${width}.webp`;

/** Photo library (all pulled from the brand's Figma file). ratio = width / height. */
export const PHOTOS = {
  'portrait-golden-arch': { ratio: 0.75, alt: 'Portrait of a woman in a white gown inside a golden arch alcove' },
  'minimalist-black-jumpsuit': { ratio: 0.75, alt: 'Fashion editorial in a black jumpsuit, Minimalist Room' },
  'minimalist-duo-white': { ratio: 0.75, alt: 'Two women in white seated on a bouclé sofa, Minimalist Room' },
  'minimalist-red-set': { ratio: 0.75, alt: 'Content shoot in a red two-piece, Minimalist Room' },
  'emerald-white-blazer': { ratio: 0.75, alt: 'Portrait session in a white blazer dress, Emerald Room' },
  'ile-oba-couple': { ratio: 0.75, alt: 'Couple in traditional attire, Ile Oba Room' },
  'ile-oba-agbada': { ratio: 0.75, alt: 'Cultural portrait in a red agbada, Ile Oba Room' },
  'ile-oba-edo-royal': { ratio: 0.75, alt: 'Royal portrait in traditional Edo attire, Ile Oba Room' },
  'room-minimalist-arches': { ratio: 0.5627, alt: 'Minimalist Room with white arch shelving and a bouclé chair' },
  'room-emerald-shelves': { ratio: 0.5627, alt: 'Emerald Room with LED-lit bookshelves, ring chandelier and cream sofa' },
  'room-emerald-panels': { ratio: 0.5627, alt: 'Emerald Room with a panelled green wall and abstract paintings' },
  'room-ile-oba-full': { ratio: 0.5627, alt: 'Ile Oba Room, full view with pendant lamp and carved furniture' },
  'room-ile-oba-niches': { ratio: 0.5627, alt: 'Ile Oba Room with curved plaster niches and artefacts' },
  'room-ile-oba-dresser': { ratio: 0.5627, alt: 'Ile Oba Room with gold-framed paintings above a carved dresser' },
};

/**
 * The three rooms. `grade` drives the colour grading of the 3D hallway:
 * wall / floor / trim colours, the light colour and the fog the camera moves through.
 */
export const ROOMS = [
  {
    id: 'minimalist',
    index: '01',
    name: 'Minimalist',
    tagline: 'Soft light. Clean lines. Nothing to hide behind.',
    description:
      'A bright, neutral-toned set with sculpted arch shelving, bouclé seating and quiet textures. Made for portraits, branding, maternity, birthdays and anything that deserves a calm, elegant backdrop.',
    bestFor: ['Portraits', 'Branding', 'Maternity', 'Lifestyle'],
    price: { single: 35000, couple: 50000 },
    cover: 'room-minimalist-arches',
    photos: ['room-minimalist-arches', 'minimalist-black-jumpsuit', 'minimalist-duo-white', 'minimalist-red-set'],
    accent: '#e9dcc6',
    grade: { wall: '#e3dacb', floor: '#8f7d68', ceiling: '#efe8dc', trim: '#f6f1e8', frame: '#f3eee6', light: '#fff0d8', fog: '#b3a48d', intensity: 1 },
  },
  {
    id: 'emerald',
    index: '02',
    name: 'Emerald',
    tagline: 'Deep green. Rich texture. Instant mood.',
    description:
      'Panelled emerald walls, LED-lit bookshelves, a ring chandelier and a cream sofa made for lounging. A modern luxury set for editorials, family portraits, birthdays and commercial content.',
    bestFor: ['Editorial', 'Family', 'Birthdays', 'Commercial'],
    price: { single: 36000, couple: 55000 },
    cover: 'room-emerald-shelves',
    photos: ['room-emerald-shelves', 'emerald-white-blazer', 'room-emerald-panels'],
    accent: '#58c9a3',
    grade: { wall: '#1d5b4a', floor: '#34261a', ceiling: '#12372d', trim: '#c7a35d', frame: '#b8944f', light: '#7fe6c2', fog: '#0c2f26', intensity: 1.15 },
  },
  {
    id: 'ile-oba',
    index: '03',
    name: 'Ile Oba',
    tagline: 'Royal by design. Rooted in heritage.',
    description:
      'A royal-inspired set with curved plaster niches, gold-framed art, carved wood and timeless African elegance. Made for bridal and cultural portraits, music videos, fashion campaigns and stories with weight.',
    bestFor: ['Bridal', 'Cultural', 'Music videos', 'Fashion'],
    price: { single: 38000, couple: 58000 },
    cover: 'room-ile-oba-niches',
    photos: ['room-ile-oba-niches', 'ile-oba-couple', 'room-ile-oba-dresser', 'ile-oba-edo-royal', 'ile-oba-agbada'],
    accent: '#e0a85a',
    grade: { wall: '#a07d58', floor: '#46301e', ceiling: '#8a6644', trim: '#c7a35d', frame: '#9a7a35', light: '#ffc888', fog: '#3a2414', intensity: 0.95 },
  },
];

export const roomById = (id) => ROOMS.find((r) => r.id === id);

/** Gallery ring order: alternates people and spaces so the ring never repeats a mood twice in a row. */
export const GALLERY = [
  { photo: 'portrait-golden-arch', caption: 'Portrait in the golden arch alcove', tag: 'Portrait' },
  { photo: 'room-ile-oba-niches', caption: 'Ile Oba Room — curved plaster niches and artefacts', tag: 'The space' },
  { photo: 'ile-oba-couple', caption: 'Couple session in traditional attire, Ile Oba Room', tag: 'Couples' },
  { photo: 'room-emerald-shelves', caption: 'Emerald Room — LED-lit shelves and ring chandelier', tag: 'The space' },
  { photo: 'minimalist-black-jumpsuit', caption: 'Fashion editorial, Minimalist Room', tag: 'Fashion' },
  { photo: 'ile-oba-agbada', caption: 'Cultural portrait in red agbada, Ile Oba Room', tag: 'Cultural' },
  { photo: 'room-minimalist-arches', caption: 'Minimalist Room — white arch shelving wall', tag: 'The space' },
  { photo: 'minimalist-duo-white', caption: 'Fashion session for two, Minimalist Room', tag: 'Fashion' },
  { photo: 'room-ile-oba-dresser', caption: 'Ile Oba Room — gold-framed art and carved dresser', tag: 'The space' },
  { photo: 'ile-oba-edo-royal', caption: 'Royal portrait in traditional Edo attire, Ile Oba Room', tag: 'Cultural' },
  { photo: 'room-emerald-panels', caption: 'Emerald Room — panelled wall with abstract art', tag: 'The space' },
  { photo: 'minimalist-red-set', caption: 'Content shoot in red, Minimalist Room', tag: 'Creators' },
  { photo: 'room-ile-oba-full', caption: 'Ile Oba Room — full view with pendant lamp', tag: 'The space' },
  { photo: 'emerald-white-blazer', caption: 'Portrait session in white, Emerald Room', tag: 'Portrait' },
];

/* ------------------------------------------------------------------ */
/* Pricing                                                             */
/* ------------------------------------------------------------------ */

export const EXTRAS = {
  halfHour: 19000, // extra 30 minutes
  extraHourDiscount: 10000, // ₦10,000 off when an extra hour is added
};

export const COMBOS = {
  single: { 2: { price: 70000 }, 3: { price: 100000 } },
  couple: { 2: { price: 70000, duration: '2 hours' }, 3: { price: 100000, duration: '3 hours' } },
};

export const COUPLE_DURATION = '1hr 30min';

export const GROUPS = [
  { id: '3', label: 'Group of 3', people: '3 people', duration: '1hr 15min', price: 90000 },
  { id: '4', label: 'Group of 4', people: '4 people', duration: '1hr 30min', price: 120000 },
  { id: '5', label: 'Group of 5', people: '5 people', duration: '2 hours', price: 135000 },
  { id: '6-8', label: 'Family of 6 to 8', people: '6 to 8 people', duration: '2 hours', price: 150000 },
];

export const PACKAGES = {
  single: { label: 'Single', long: 'Single user', blurb: 'One creator, one session, the whole set to yourself.' },
  couple: { label: 'Couple', long: 'Couple', blurb: 'Two of you, ninety unhurried minutes per room.' },
  group: { label: 'Family / Group', long: 'Family / Group', blurb: 'Three to eight people in one room of your choice.' },
};

const SET_POINTS = ['Fully styled set, props and furniture', 'Photo and video friendly', 'Bring your own photographer'];

/** Cards for the pricing section, four per tab so the stack height never jumps. */
export const PRICING = {
  single: [
    ...ROOMS.map((r) => ({
      kind: 'room',
      title: `${r.name} Room`,
      eyebrow: 'Single user · per session',
      price: r.price.single,
      photo: r.cover,
      line: r.tagline,
      points: SET_POINTS,
      book: { pkg: 'single', rooms: [r.id] },
    })),
    {
      kind: 'combo',
      title: 'Room Combos',
      eyebrow: 'Single user · more looks, one visit',
      photo: 'portrait-golden-arch',
      line: 'Change the mood without changing address.',
      rows: [
        { label: 'Any two rooms', price: COMBOS.single[2].price, book: { pkg: 'single', count: 2 } },
        { label: 'All three rooms', price: COMBOS.single[3].price, book: { pkg: 'single', rooms: ROOMS.map((r) => r.id) } },
      ],
    },
  ],
  couple: [
    ...ROOMS.map((r) => ({
      kind: 'room',
      title: `${r.name} Room`,
      eyebrow: `Couple · ${COUPLE_DURATION}`,
      price: r.price.couple,
      photo: r.id === 'ile-oba' ? 'ile-oba-couple' : r.cover,
      line: r.tagline,
      points: [`${COUPLE_DURATION} in the room`, ...SET_POINTS.slice(0, 2)],
      book: { pkg: 'couple', rooms: [r.id] },
    })),
    {
      kind: 'combo',
      title: 'Room Combos',
      eyebrow: 'Couple · longer sessions',
      photo: 'minimalist-duo-white',
      line: 'More rooms, more time, more of the two of you.',
      rows: [
        { label: 'Two rooms', note: COMBOS.couple[2].duration, price: COMBOS.couple[2].price, book: { pkg: 'couple', count: 2 } },
        { label: 'All three rooms', note: COMBOS.couple[3].duration, price: COMBOS.couple[3].price, book: { pkg: 'couple', rooms: ROOMS.map((r) => r.id) } },
      ],
    },
  ],
  group: GROUPS.map((g, i) => ({
    kind: 'room',
    title: g.label,
    eyebrow: `Single room · ${g.duration}`,
    price: g.price,
    photo: ['minimalist-duo-white', 'room-emerald-shelves', 'ile-oba-couple', 'room-ile-oba-full'][i],
    line: `${g.duration} in the room of your choice.`,
    points: [`${g.people}, one room`, `${g.duration} session`, 'Children under 10 come free'],
    book: { pkg: 'group', size: g.id },
  })),
};

export const PRICING_NOTES = [
  { title: 'Little ones are on us', text: 'Children under 10 are not charged. Only their parents are.' },
  { title: 'Running over?', text: `An extra 30 minutes is ${naira(EXTRAS.halfHour)}.` },
  { title: 'Stay the extra hour', text: `Add a full extra hour and take ${naira(EXTRAS.extraHourDiscount)} off any price.` },
];

/**
 * Works out a booking estimate.
 * @param {{pkg:'single'|'couple'|'group', rooms:string[], size?:string, extra?:'none'|'30'|'60'}} sel
 */
export function quote({ pkg, rooms = [], size = '3', extra = 'none' }) {
  const count = rooms.length;
  if (!count) return null;
  let base = 0;
  let duration = '';
  let label = '';

  if (pkg === 'group') {
    const g = GROUPS.find((x) => x.id === size) || GROUPS[0];
    base = g.price;
    duration = g.duration;
    label = `${PACKAGES.group.long} — ${g.label}`;
  } else if (count === 1) {
    base = roomById(rooms[0]).price[pkg];
    duration = pkg === 'couple' ? COUPLE_DURATION : '';
    label = PACKAGES[pkg].long;
  } else {
    const combo = COMBOS[pkg][Math.min(count, 3)];
    base = combo.price;
    duration = combo.duration || '';
    label = `${PACKAGES[pkg].long} — ${count === 2 ? 'two-room combo' : 'all three rooms'}`;
  }

  const addOn = extra === '30' ? EXTRAS.halfHour : 0;
  return {
    label,
    duration,
    base,
    addOn,
    total: base + addOn,
    // the extra-hour offer is confirmed by the studio, so it is flagged rather than guessed
    extraHour: extra === '60',
  };
}

/* ------------------------------------------------------------------ */
/* House rules                                                         */
/* ------------------------------------------------------------------ */

export const RULES = [
  {
    icon: 'clock',
    title: 'Be on time',
    text: 'Your session starts at the time you booked, not when you arrive. Come ten to fifteen minutes early to settle in, because time lost to late arrival comes out of your slot so the next creator can start on schedule.',
  },
  {
    icon: 'receipt',
    title: 'Booking and payment',
    text: 'A date is only held once your booking is confirmed on WhatsApp and your payment has been received. No confirmation means no reservation, so please wait for ours before you plan your shoot day.',
  },
  {
    icon: 'calendar',
    title: 'Rescheduling',
    text: 'Plans change. Tell us at least 24 hours before your session and we will move you to the next available slot. Late changes and no-shows cannot be carried over.',
  },
  {
    icon: 'armchair',
    title: 'Care for props and furniture',
    text: 'Everything on set is there to be used, gently. Please do not drag furniture, stand on seating or take props between rooms without asking. Breakages and damage are billed to the booking.',
  },
  {
    icon: 'light',
    title: 'Lighting and equipment',
    text: 'The rooms are lit and styled to shoot beautifully as they are. Outside lighting, backdrops, smoke machines and heavy equipment need our approval before your session, so mention them when you book.',
  },
  {
    icon: 'sparkle',
    title: 'Keep it clean',
    text: 'No food or drinks on set, and no confetti, glitter, powder, oils or open flames without approval. Leave each room the way you met it, with your belongings and rubbish taken with you.',
  },
  {
    icon: 'people',
    title: 'Guests and little ones',
    text: 'Bring only the people your shoot needs so the set stays calm and clear. Children are very welcome and must be supervised by an adult at all times.',
  },
  {
    icon: 'hanger',
    title: 'Outfit changes and wrap-up',
    text: 'Changing is part of your session time, so plan your looks in advance. Start wrapping up five minutes before the end. If you need longer, ask us about extra time before your slot runs out.',
  },
  {
    icon: 'heart',
    title: 'Respect the space',
    text: 'Amaris is a shared creative home. Keep music and voices considerate, treat the team and other creators kindly, and we will do everything we can to make your shoot effortless.',
  },
];
