# Amaris Content Studios

Website for Amaris Content Studios, an aesthetic rental content studio in Ekpoma, Edo State, Nigeria.

Vanilla HTML, CSS and JavaScript (ES modules). No framework and no build step.
Three.js drives the 3D sections, GSAP ScrollTrigger the scroll animation and Lenis the smooth scroll.

## Run it locally

The site uses ES modules, which browsers will not load from a `file://` address, so it has to be served. Any of these works:

**Option 1: Node (nothing to install)**

```bash
node server.js
```

Then open <http://localhost:5173>. (`npm start` does the same. Use `PORT=8080 node server.js` for another port.)

**Option 2: Python**

```bash
python -m http.server 5173
```

**Option 3: VS Code**

Install the "Live Server" extension, right-click `index.html` and choose "Open with Live Server".

### Handy test switches

Add these to the address to preview the different modes:

| Address | What it shows |
| --- | --- |
| `/?lite=1` | The lightweight fallback (what visitors get without WebGL or with "reduce motion" switched on) |
| `/?tier=low` | Phone-quality 3D on a desktop |
| `/?gl=1` | Allows software-rendered WebGL (normally treated as "no WebGL") |

## What is where

```
index.html              All page markup, in the order of the site flow
css/
  base.css              Colour and type tokens, reset, buttons, grain overlay
  fonts.css             Self-hosted Fraunces + Outfit
  loader.css … contact.css   One stylesheet per section
js/
  main.js               Entry point: boots everything in order
  vendor.js             Single import point for GSAP, ScrollTrigger and Lenis
  data/studio.js        ALL content data: contacts, rooms, photos, prices, rules
  core/
    env.js              Device / WebGL / reduced-motion detection, quality tier
    scroll.js           Lenis + ScrollTrigger wiring
    pointer.js          Shared cursor / gyroscope tilt input
    stage.js            The one shared WebGL renderer and texture cache
    kit.js              3D building blocks (arches, plaster, dust, framed photos)
    dom.js              Small DOM helpers and inline icons
  sections/
    loader.js           1. Logo on the amber door, door opens
    nav.js              Navigation, anchor scrolling, phone menu
    hero.js             2. Headline intro + scroll choreography
    hero.scene.js          …and its 3D doorway
    about.js            3. Drifting photo cards with cursor / gyro tilt
    rooms.js            4. Room cards + scroll timeline
    rooms.scene.js         …and the 3D hallway
    gallery.js          5. Ring controls (scroll, drag, hover, click)
    gallery.scene.js       …and the 3D photo ring
    lightbox.js            …and the zoomed photo viewer
    pricing.js          6. Tabs + sticky stacked flip cards
    rules.js            7. Accordion
    booking.js          8. Booking form and WhatsApp message builder
    contact.js          9. Giant AS mark, floating WhatsApp button
assets/
  img/                  Photos as WebP in three widths (480, 800, 1600)
  logo/                 Logo lock-up and AS mark (SVG) plus the original PNG
  fonts/                Variable fonts (woff2)
vendor/                 three.js, GSAP + ScrollTrigger, Lenis (minified ES modules)
server.js               Tiny static server for local preview
```

Each 3D section is split in two files on purpose: `x.js` holds the page logic and loads `x.scene.js` (and Three.js itself) only when the device can run it.

## Changing content

**Prices, rooms, rules, gallery captions:** edit `js/data/studio.js`. The rooms section, the pricing cards, the booking form and the WhatsApp message all read from that one file, so a price only ever needs changing in one place.

**Headline and section copy:** edit the text directly in `index.html`.

**WhatsApp number, Instagram and address:** these live in `js/data/studio.js` (`STUDIO`) and in the plain links inside `index.html`. Search the project for `2348034750928` and `amarisstudio_ng` to update every place.

**Adding a photo:**

1. Export it as WebP in three widths and save them as `assets/img/<name>-480.webp`, `<name>-800.webp` and `<name>-1600.webp`.
2. Add it to `PHOTOS` in `js/data/studio.js` with its ratio (width ÷ height) and a short description.
3. Use the name in a room's `photos` list or in `GALLERY`.

**Colours and fonts:** the tokens at the top of `css/base.css`.

## How it behaves on different devices

- **Phones:** lower pixel density, smaller textures, fewer particles and cheaper materials. The About cards follow the gyroscope (iOS asks for permission with one tap).
- **No WebGL, or "reduce motion" is on:** the page switches to the lite layout. The hero becomes a still arch photo, the rooms become stacked features, the gallery becomes a swipeable strip with the same lightbox, and pricing cards are shown without the flip.
- **Slow frames:** the 3D renderer drops its pixel density automatically.
- Nothing is rendered while no 3D section is on screen or while the tab is in the background.

## Putting it online

Upload the folder as it is to any static host (Netlify, Vercel, Cloudflare Pages, GitHub Pages or ordinary cPanel hosting). There is nothing to build. `server.js`, `package.json` and this README are only for local preview and can be left out.

For link previews on WhatsApp and Instagram, change the `og:image` address in `index.html` to the full web address of `assets/og-cover.jpg` once the domain is known.

## Credits

- Photography, logo and brand: Amaris Studio.
- [three.js](https://threejs.org) (MIT), [GSAP + ScrollTrigger](https://gsap.com) (GSAP standard licence), [Lenis](https://lenis.darkroom.engineering) (MIT).
- Fonts: Fraunces and Outfit (SIL Open Font License).

## Making sure visitors see your changes

Phones cache scripts and styles for a while. Every script import and stylesheet link ends in `?v=5`.
After you change any JS or CSS file, bump that number everywhere in one go, for example from the repo folder:

```bash
grep -rl "?v=5" index.html js | xargs sed -i "s/?v=5/?v=6/g"
```
