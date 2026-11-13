/**
 * 5. Gallery — the photo ring.
 *
 * Every photo is a curved panel on a cylinder. `state.scroll` (0 → 1) and
 * `state.drag` turn the ring; the hovered panel lifts off the ring and tilts
 * towards the cursor. gallery.js asks this module which panel is under the
 * pointer and where it sits on screen, so the lightbox can zoom out of it.
 */
import * as THREE from '../core/three.js?v=5';
import { coverUVs, glowTexture, glow, dust, revealWhenReady } from '../core/kit.js?v=5';
import { pointer } from '../core/pointer.js?v=5';
import { PHOTOS } from '../data/studio.js?v=5';

const PANEL = { w: 2.3, h: 3.12, gap: 0.36 };
const TURNS = 1.12; // how far the ring turns over the whole section

export function createGalleryScene({ stage, slot, items }) {
  const low = stage.low;
  const count = items.length;
  const step = (Math.PI * 2) / count;
  const radius = (count * (PANEL.w + PANEL.gap)) / (Math.PI * 2);

  const state = {
    scroll: 0,
    drag: 0,
    /** index of the hovered panel, or -1 */
    hover: -1,
    /** cursor position inside the hovered panel, -1..1 */
    hoverU: 0,
    hoverV: 0,
    /** true while the visitor is dragging the ring (pauses the settle below) */
    dragging: false,
    /** called with the index of the panel facing the camera whenever it changes */
    onFront: null,
  };

  const scene = new THREE.Scene();
  const night = new THREE.Color('#0b0705');
  scene.background = night;
  scene.fog = new THREE.Fog(night, radius * 1.1, radius * 3.6);

  const camera = new THREE.PerspectiveCamera(44, 1, 0.1, 80);

  const tilt = new THREE.Group(); // leans the whole ring towards the camera / cursor
  const ring = new THREE.Group(); // spins
  tilt.add(ring);
  scene.add(tilt);

  /* ---------- panels ---------- */
  const panels = items.map((item, i) => {
    const geo = new THREE.PlaneGeometry(PANEL.w, PANEL.h, low ? 10 : 18, 1);
    coverUVs(geo, PANEL.w, PANEL.h, PHOTOS[item.photo].ratio);
    // bend the flat plane onto the cylinder, keeping its centre at the origin
    const pos = geo.attributes.position;
    for (let v = 0; v < pos.count; v++) {
      const a = pos.getX(v) / radius;
      pos.setXYZ(v, Math.sin(a) * radius, pos.getY(v), Math.cos(a) * radius - radius);
    }
    geo.computeVertexNormals();

    const texture = stage.photo(item.photo);
    const material = new THREE.MeshBasicMaterial({ map: texture, toneMapped: false, side: THREE.DoubleSide });
    revealWhenReady(material, texture);

    const mesh = new THREE.Mesh(geo, material);
    mesh.position.z = radius;
    mesh.userData.index = i;

    const holder = new THREE.Group();
    holder.rotation.y = i * step;
    holder.add(mesh);
    ring.add(holder);
    return { mesh, material, lift: 0, shade: 1 };
  });

  /* ---------- atmosphere ---------- */
  const glowTex = glowTexture();
  const core = glow(glowTex, '#e39a45', 0.22);
  core.scale.set(radius * 3.4, radius * 2.6, 1);
  core.position.set(0, 0.2, -radius * 0.2);
  scene.add(core);

  const floorGlow = glow(glowTex, '#c7a35d', 0.16);
  floorGlow.rotation.x = -Math.PI / 2;
  floorGlow.scale.set(radius * 3.4, radius * 3.4, 1);
  floorGlow.position.y = -PANEL.h * 0.72;
  tilt.add(floorGlow);

  const motes = dust({
    count: low ? 70 : 200,
    box: [radius * 3, 7, radius * 3],
    center: [0, 0.4, 0],
    color: '#ffd9a0',
    size: low ? 30 : 24,
    opacity: 0.7,
  });
  scene.add(motes);

  /* ---------- camera ---------- */
  function resize(w, h) {
    const aspect = w / h;
    camera.aspect = aspect;
    const portrait = aspect < 0.9;
    camera.fov = portrait ? 50 : 44;
    const tan = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    // the front photo fills a set share of the screen height (leaving room for the title
    // above and the caption below) and never more than ~3/4 of the width
    const byHeight = PANEL.h / (portrait ? 0.38 : 0.41) / (2 * tan);
    const byWidth = (1.34 * (PANEL.w + PANEL.gap)) / 2 / (tan * aspect);
    const dist = Math.max(byHeight, byWidth);
    camera.position.set(0, 0.95, radius + dist);
    camera.lookAt(0, portrait ? 0.1 : 0.05, radius);
    camera.updateProjectionMatrix();
    scene.fog.near = camera.position.z - radius * 0.6;
    scene.fog.far = camera.position.z + radius * 1.9;
    motes.material.uniforms.uScale.value = (h / 900) * stage.renderer.getPixelRatio();
  }

  /* ---------- picking ---------- */
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const meshes = panels.map((p) => p.mesh);

  /** Panel under a viewport point. Only panels on the near side of the ring count. */
  function pick(clientX, clientY) {
    const rect = slot.getBoundingClientRect();
    ndc.set(((clientX - rect.left) / rect.width) * 2 - 1, -((clientY - rect.top) / rect.height) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
    const hit = raycaster.intersectObjects(meshes, false)[0];
    if (!hit || hit.point.z < radius * 0.25) return null;
    return { index: hit.object.userData.index, u: hit.uv.x * 2 - 1, v: hit.uv.y * 2 - 1 };
  }

  /** Bounding box of a panel in viewport pixels (the lightbox zooms out of it). */
  const corner = new THREE.Vector3();
  function screenRect(index) {
    const { mesh } = panels[index];
    const rect = slot.getBoundingClientRect();
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const [x, y] of [
      [-PANEL.w / 2, -PANEL.h / 2],
      [PANEL.w / 2, -PANEL.h / 2],
      [-PANEL.w / 2, PANEL.h / 2],
      [PANEL.w / 2, PANEL.h / 2],
    ]) {
      const a = x / radius;
      corner.set(Math.sin(a) * radius, y, Math.cos(a) * radius - radius);
      mesh.localToWorld(corner).project(camera);
      const sx = rect.left + ((corner.x + 1) / 2) * rect.width;
      const sy = rect.top + ((1 - corner.y) / 2) * rect.height;
      minX = Math.min(minX, sx);
      maxX = Math.max(maxX, sx);
      minY = Math.min(minY, sy);
      maxY = Math.max(maxY, sy);
    }
    return { left: minX, top: minY, width: maxX - minX, height: maxY - minY };
  }

  /* ---------- per-frame ---------- */
  let angle = 0;
  let front = -1;
  const white = new THREE.Color(0xffffff);

  const targetAngle = () => state.scroll * Math.PI * 2 * TURNS + state.drag;

  // when the ring is left alone it settles so that one photo faces the camera squarely
  let lastTarget = 0;
  let stillFor = 0;
  let settle = 0;

  function update(time, dt) {
    const k = 1 - Math.exp(-dt * 7);
    const target = targetAngle();
    stillFor = Math.abs(target - lastTarget) > 0.0004 || state.dragging ? 0 : stillFor + dt;
    lastTarget = target;
    const wanted = stillFor > 0.18 ? Math.round(target / step) * step - target : 0;
    settle += (wanted - settle) * (1 - Math.exp(-dt * 4));
    angle += (target + settle - angle) * k;
    ring.rotation.y = -angle;

    tilt.rotation.x = 0.12 + pointer.sy * 0.045;
    tilt.rotation.z = -pointer.sx * 0.025;
    tilt.position.y = Math.sin(time * 0.35) * 0.06;

    const hovering = state.hover >= 0;
    panels.forEach((p, i) => {
      const isHover = i === state.hover;
      p.lift += ((isHover ? 1 : 0) - p.lift) * k;
      p.shade += ((hovering && !isHover ? 0.5 : 1) - p.shade) * k;
      p.mesh.position.z = radius + p.lift * 0.55;
      p.mesh.scale.setScalar(1 + p.lift * 0.07);
      p.mesh.rotation.y = isHover ? state.hoverU * 0.16 * p.lift : p.mesh.rotation.y * (1 - k);
      p.mesh.rotation.x = isHover ? -state.hoverV * 0.12 * p.lift : p.mesh.rotation.x * (1 - k);
      if (p.material.userData.revealed) p.material.color.copy(white).multiplyScalar(p.shade);
    });

    const nearest = ((Math.round(angle / step) % count) + count) % count;
    if (nearest !== front) {
      front = nearest;
      state.onFront?.(front);
    }
    motes.material.uniforms.uTime.value = time;
  }

  // shading only kicks in once a photo has finished fading up from black
  panels.forEach((p) => p.material.map.userData.ready.then(() => setTimeout(() => (p.material.userData.revealed = true), 1000)));

  stage.register({ slot, scene, camera, update, resize });

  return {
    state,
    step,
    turns: TURNS,
    pick,
    screenRect,
    get front() {
      return Math.max(0, front);
    },
    /** drag offset that brings panel `index` to the front by the shortest way round */
    dragTo(index) {
      const current = targetAngle();
      let delta = index * step - current;
      delta = ((((delta + Math.PI) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)) - Math.PI;
      return state.drag + delta;
    },
  };
}
