/**
 * 4. Rooms — the 3D hallway.
 *
 * Three arches, one per room, stand in a line. Behind each arch the walls,
 * floor, light and fog take on that room's palette and its photos hang in
 * slim frames. `state.t` (0 → 1, driven by scroll in rooms.js) moves the
 * camera along `path`, dwelling in each room; the fog colour follows the
 * camera so the whole picture re-grades as you pass under an arch.
 */
import * as THREE from '../core/three.js?v=5';
import {
  archWallGeometry,
  archTrimGeometry,
  archPanelGeometry,
  plasterTexture,
  glowTexture,
  glow,
  dust,
  framedPhoto,
  labelPlane,
  surface,
} from '../core/kit.js?v=5';
import { pointer } from '../core/pointer.js?v=5';
import { PHOTOS } from '../data/studio.js?v=5';

const L = 16; // length of one room
const W = 7.2; // hallway width
const H = 5.4; // hallway height
const WALL = 0.7; // arch wall thickness
const ARCH = { w: 2.9, h: 4.15 };
const ENTRY = 14; // dark approach before the first arch

/** How the scroll is shared out (fractions of the whole journey). */
const TIME = { intro: 0.08, travel: 0.145, dwell: 0.125 };

const ease = {
  inOut: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  soft: (t) => t * t * (3 - 2 * t),
  in: (t) => t * t,
};

export function createRoomsScene({ stage, slot, rooms }) {
  const low = stage.low;
  const seg = low ? 14 : 24;
  const state = { t: 0 };

  const scene = new THREE.Scene();
  const NIGHT = new THREE.Color('#0a0705');
  scene.background = NIGHT.clone();
  scene.fog = new THREE.Fog(NIGHT.clone(), 7, 42);

  const camera = new THREE.PerspectiveCamera(52, 1, 0.1, 100);

  const plaster = plasterTexture();
  plaster.repeat.set(0.3, 0.3);
  const plasterLong = plaster.clone();
  plasterLong.repeat.set(5, 1.7);
  const glowTex = glowTexture();

  /* ---------- building blocks ---------- */

  function shell(z0, length, colors) {
    const zc = z0 - length / 2;
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(W, length), surface(low, { color: colors.floor, roughness: 0.55, metalness: 0.08 }));
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(0, 0, zc);
    const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(W, length), surface(low, { color: colors.ceiling }));
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.set(0, H, zc);
    scene.add(floor, ceiling);
    const wallMat = surface(low, { color: colors.wall, map: plasterLong });
    for (const side of [-1, 1]) {
      const wall = new THREE.Mesh(new THREE.PlaneGeometry(length, H), wallMat);
      wall.rotation.y = -side * (Math.PI / 2);
      wall.position.set(side * (W / 2), H / 2, zc);
      scene.add(wall);
    }
  }

  function arch(z0, colors, pointed, sign) {
    const wall = new THREE.Mesh(
      archWallGeometry({ width: W, height: H, depth: WALL, archW: ARCH.w, archH: ARCH.h, pointed, segments: seg }),
      // groups: 0 = wall faces, 1 = the reveal inside the arch
      [surface(low, { color: colors.wall, map: plaster, bumpMap: plaster, bumpScale: 0.4 }), surface(low, { color: colors.reveal || colors.wall, roughness: 0.85 })]
    );
    wall.position.z = z0;
    const trim = new THREE.Mesh(
      archTrimGeometry({ archW: ARCH.w, archH: ARCH.h, pointed, band: 0.1, depth: WALL + 0.12, segments: seg }),
      surface(low, { color: colors.trim, roughness: 0.5, metalness: 0.25 })
    );
    trim.position.z = z0 + 0.06;
    scene.add(wall, trim);
    if (sign) {
      sign.position.set(0, ARCH.h + (H - ARCH.h) / 2 + 0.04, z0 + 0.02);
      scene.add(sign);
    }
  }

  const floaters = [];
  function hang(name, { x, y, z, rotY, width, frameColor }) {
    const photo = framedPhoto({ texture: stage.photo(name), width, ratio: PHOTOS[name].ratio, frameColor });
    photo.position.set(x, y, z);
    photo.rotation.y = rotY;
    scene.add(photo);
    floaters.push({ obj: photo, baseY: y, phase: floaters.length * 1.7 });
    return photo;
  }

  function emissiveBar(w, h, d, color) {
    return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshBasicMaterial({ color, toneMapped: false }));
  }

  /* ---------- the approach ---------- */
  shell(ENTRY, ENTRY, { wall: '#5a3d26', floor: '#2a1a0f', ceiling: '#2c1c10' });
  const entryLight = new THREE.PointLight('#ffb463', 70, 24, 1.7);
  entryLight.position.set(0, 4.4, 6);
  scene.add(entryLight);

  scene.add(new THREE.HemisphereLight('#fff1dc', '#2a1b10', 0.62));

  /* ---------- the three rooms ---------- */
  const covers = [];
  rooms.forEach((room, i) => {
    const z0 = -i * L;
    const g = room.grade;
    const side = i % 2 === 0 ? -1 : 1; // which wall the cover photo hangs on
    const pointed = room.id === 'ile-oba' ? 0.3 : 0;

    const sign = labelPlane({
      text: room.name,
      sub: `Room ${room.index}`,
      color: '#f1dcab',
      height: 0.42,
    });
    arch(z0, g, pointed, sign);
    shell(z0, L, g);

    const light = new THREE.PointLight(g.light, 78 * g.intensity, 27, 1.6);
    light.position.set(0, H - 0.9, z0 - 8);
    scene.add(light);

    // photos: the room itself on one wall, the people shot in it on the others
    const [cover, ...rest] = room.photos;
    const coverPhoto = hang(cover, { x: side * 1.95, y: 2.28, z: z0 - 10.6, rotY: -side * 0.42, width: 2.05, frameColor: g.frame });
    covers.push({ side, x: side * 1.95, y: 2.28, z: z0 - 10.6, obj: coverPhoto });

    const spots = [
      { x: -side * 2.55, y: 2.25, z: z0 - 3.7, rotY: side * 0.82, width: 1.45 },
      { x: -side * 2.4, y: 2.3, z: z0 - 12.9, rotY: side * 0.52, width: 1.5 },
      { x: side * 2.75, y: 2.15, z: z0 - 14.5, rotY: -side * 0.78, width: 1.2 },
      { x: side * 2.85, y: 2.2, z: z0 - 5.2, rotY: -side * 0.95, width: 1.2 },
    ];
    rest.forEach((name, n) => {
      const spot = spots[n];
      if (!spot) return;
      // tall interior shots get a narrower frame so they stay inside the hallway height
      const width = PHOTOS[name].ratio < 0.6 ? spot.width * 0.84 : spot.width;
      hang(name, { ...spot, width, frameColor: g.frame });
    });

    /* --- set dressing that echoes the real room --- */
    if (room.id === 'minimalist') {
      // rows of shallow arch niches, like the white shelving wall
      const nicheGeo = archPanelGeometry({ width: 0.82, height: 1.7, segments: 12 });
      const nicheMat = surface(low, { color: '#cdc2b0' });
      for (const s of [-1, 1]) {
        for (let n = 0; n < 5; n++) {
          const niche = new THREE.Mesh(nicheGeo, nicheMat);
          niche.rotation.y = -s * (Math.PI / 2);
          niche.position.set(s * (W / 2 - 0.012), 1.25, z0 - 6.2 - n * 1.25);
          scene.add(niche);
        }
        // warm cove lighting along the ceiling
        const cove = emissiveBar(0.05, 0.04, L - 1.5, '#fff0cf');
        cove.position.set(s * (W / 2 - 0.3), H - 0.06, z0 - L / 2);
        scene.add(cove);
      }
    }

    if (room.id === 'emerald') {
      // glowing shelf lines running down both walls
      for (const s of [-1, 1]) {
        for (let n = 0; n < 4; n++) {
          const bar = emissiveBar(0.03, 0.035, 6.5, '#8ff0cd');
          bar.position.set(s * (W / 2 - 0.05), 1.1 + n * 0.92, z0 - 8);
          scene.add(bar);
        }
      }
      // the ring chandelier
      const ringMat = new THREE.MeshBasicMaterial({ color: '#f4fff9', toneMapped: false });
      [
        [0, 4.25, 0, 0.5, 0.3, 0.2],
        [0.32, 4.02, 0.1, 0.38, -0.5, 0.9],
        [-0.28, 3.86, -0.12, 0.3, 0.9, -0.4],
      ].forEach(([x, y, z, r, rx, rz]) => {
        const ring = new THREE.Mesh(new THREE.TorusGeometry(r, 0.02, 8, low ? 32 : 56), ringMat);
        ring.position.set(x, y, z0 - 8 + z);
        ring.rotation.set(Math.PI / 2 + rx, 0, rz);
        scene.add(ring);
      });
      const shine = glow(glowTex, '#9ff5d6', 0.3);
      shine.scale.set(4.2, 4.2, 1);
      shine.position.set(0, 4.05, z0 - 8);
      scene.add(shine);
    }

    if (room.id === 'ile-oba') {
      // curved plaster niches and a woven pendant lamp
      const nicheGeo = archPanelGeometry({ width: 1.1, height: 2.3, pointed: 0.3, segments: 12 });
      const nicheMat = surface(low, { color: '#8c6238' });
      for (const s of [-1, 1]) {
        for (let n = 0; n < 3; n++) {
          const niche = new THREE.Mesh(nicheGeo, nicheMat);
          niche.rotation.y = -s * (Math.PI / 2);
          niche.position.set(s * (W / 2 - 0.012), 1.0, z0 - 7 - n * 1.9);
          scene.add(niche);
        }
      }
      const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.24, 20, 14), new THREE.MeshBasicMaterial({ color: '#ffd596', toneMapped: false }));
      lamp.position.set(0, 3.95, z0 - 8);
      const cord = emissiveBar(0.012, H - 4.15, 0.012, '#3a2414');
      cord.position.set(0, (H + 4.15) / 2, z0 - 8);
      const lampGlow = glow(glowTex, '#ffb45e', 0.5);
      lampGlow.scale.set(4.4, 4.4, 1);
      lampGlow.position.copy(lamp.position);
      scene.add(lamp, cord, lampGlow);
    }
  });

  /* ---------- the far end: a last glowing arch ---------- */
  const endZ = -rooms.length * L;
  arch(endZ, { wall: '#3a2414', trim: '#c7a35d' }, 0.3, null);
  const endGlow = glow(glowTex, '#ffb866', 0.95);
  endGlow.scale.set(9, 9, 1);
  endGlow.position.set(0, 2.4, endZ - 2.2);
  scene.add(endGlow);
  const endLight = new THREE.PointLight('#ffa64d', 40, 16, 1.8);
  endLight.position.set(0, 2.6, endZ - 1.5);
  scene.add(endLight);

  const motes = dust({
    count: low ? 130 : 340,
    box: [W - 1.2, H - 0.8, rooms.length * L + 16],
    center: [0, H / 2, endZ / 2 + 4],
    color: '#ffe6c0',
    size: low ? 30 : 26,
    opacity: 0.75,
  });
  scene.add(motes);

  /* ---------- colour grade along the hallway ---------- */
  const stops = [{ z: 8, color: NIGHT.clone() }];
  rooms.forEach((room, i) => {
    const z0 = -i * L;
    const c = new THREE.Color(room.grade.fog);
    stops.push({ z: z0 - 1.8, color: c }, { z: z0 - L + 3.2, color: c });
  });
  stops.push({ z: endZ - 1.5, color: NIGHT.clone() });

  const grade = new THREE.Color();
  function gradeAt(z) {
    if (z >= stops[0].z) return grade.copy(stops[0].color);
    for (let i = 0; i < stops.length - 1; i++) {
      const a = stops[i];
      const b = stops[i + 1];
      if (z <= a.z && z >= b.z) {
        const t = a.z === b.z ? 0 : (a.z - z) / (a.z - b.z);
        return grade.copy(a.color).lerp(b.color, ease.soft(t));
      }
    }
    return grade.copy(stops[stops.length - 1].color);
  }

  /* ---------- camera path ---------- */
  let path = [];
  let portrait = false;

  function buildPath() {
    const key = (px, py, pz, lx, ly, lz) => ({ p: new THREE.Vector3(px, py, pz), l: new THREE.Vector3(lx, ly, lz) });
    const start = key(0, 2.35, 11, 0, 2.3, -6);
    const entry = key(0, 2.35, 7.2, 0, 2.3, -8);
    const segs = [];
    let t = 0;
    const push = (from, to, span, fn) => {
      segs.push({ from, to, t0: t, t1: t + span, ease: fn });
      t += span;
    };
    push(start, entry, TIME.intro, ease.soft);

    let prev = entry;
    covers.forEach((cover) => {
      const s = cover.side;
      const z0 = cover.z + 10.6;
      // desktop: the cover photo sits to one side, leaving room for the info card on the other.
      // portrait: the camera turns to face the cover photo, with the card underneath.
      const a = portrait
        ? key(-s * 0.35, 2.35, z0 - 3.6, s * 1.75, 1.0, cover.z)
        : key(-s * 0.6, 2.3, z0 - 5.2, s * 0.2, 2.3, cover.z);
      const b = portrait
        ? key(-s * 0.45, 2.35, z0 - 4.6, s * 1.8, 1.05, cover.z)
        : key(-s * 0.8, 2.3, z0 - 6.4, s * 0.3, 2.3, cover.z);
      push(prev, a, TIME.travel, ease.inOut);
      push(a, b, TIME.dwell, ease.soft);
      prev = b;
    });

    const exit = key(0, 2.3, endZ + 4.6, 0, 2.4, endZ - 2);
    segs.push({ from: prev, to: exit, t0: t, t1: 1, ease: ease.inOut });
    path = segs;
  }

  /** Scroll positions (0..1) where each room's card should appear and leave. */
  const marks = rooms.map((_, i) => {
    const dwellStart = TIME.intro + i * (TIME.travel + TIME.dwell) + TIME.travel;
    return { in: dwellStart - 0.04, out: dwellStart + TIME.dwell + 0.012, focus: dwellStart + TIME.dwell * 0.45 };
  });

  const pos = new THREE.Vector3();
  const look = new THREE.Vector3();
  function pose(t) {
    let seg = path[path.length - 1];
    for (const s of path) {
      if (t <= s.t1) {
        seg = s;
        break;
      }
    }
    const k = seg.ease(THREE.MathUtils.clamp((t - seg.t0) / (seg.t1 - seg.t0), 0, 1));
    pos.lerpVectors(seg.from.p, seg.to.p, k);
    look.lerpVectors(seg.from.l, seg.to.l, k);
  }

  function resize(w, h) {
    const aspect = w / h;
    portrait = aspect < 0.9;
    camera.aspect = aspect;
    camera.fov = portrait ? 66 : 52;
    camera.updateProjectionMatrix();
    buildPath();
    motes.material.uniforms.uScale.value = (h / 900) * stage.renderer.getPixelRatio();
  }
  buildPath();

  function update(time) {
    pose(state.t);
    camera.position.set(pos.x + pointer.sx * 0.26, pos.y - pointer.sy * 0.14, pos.z);
    look.x += pointer.sx * 0.5;
    look.y -= pointer.sy * 0.25;
    camera.lookAt(look);

    gradeAt(camera.position.z);
    scene.fog.color.copy(grade);
    scene.background.copy(grade);

    for (const f of floaters) {
      f.obj.position.y = f.baseY + Math.sin(time * 0.6 + f.phase) * 0.045;
    }
    motes.material.uniforms.uTime.value = time;
  }

  stage.register({ slot, scene, camera, update, resize, wants: () => state.t < 0.998 });

  return {
    state,
    marks,
    /** current fog colour as a CSS hex string, for the DOM colour-grade overlay */
    gradeHex: () => `#${grade.getHexString()}`,
  };
}
