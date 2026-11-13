/**
 * 2. Hero — the 3D doorway.
 *
 * A plaster wall with a pointed arch stands in front of the camera. Warm light
 * spills through it; inside, the model photo floats in an arch-shaped frame.
 * `state.progress` (0 → 1, driven by scroll in hero.js) dollies the camera
 * through the doorway, around the photo and on through a second arch into the light.
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
  revealWhenReady,
  surface,
} from '../core/kit.js?v=5';
import { pointer } from '../core/pointer.js?v=5';

const POINTED = 0.34;
const DOOR = { w: 3.3, h: 5.5, depth: 0.9 };
const INNER = { z: -13, w: 2.5, h: 4.4, depth: 0.7 };
const HALL = { halfWidth: 3.7, height: 7.6 };
const END_Z = -16.6;

const smooth = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

export function createHeroScene({ stage, slot }) {
  const low = stage.low;
  const seg = low ? 14 : 26;
  const state = { progress: 0 };

  const scene = new THREE.Scene();
  const night = new THREE.Color('#0a0604');
  scene.background = night;
  scene.fog = new THREE.Fog(night, 7, 36);

  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 90);

  /* ---------- architecture ---------- */
  const plaster = plasterTexture();
  plaster.repeat.set(0.3, 0.3);
  const plasterWide = plaster.clone();
  plasterWide.repeat.set(5, 2);

  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(44, 80),
    surface(low, { color: '#2b1a0e', roughness: 0.5, metalness: 0.12 })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.z = -12;
  scene.add(floor);

  const doorWall = new THREE.Mesh(
    archWallGeometry({ width: 26, height: 12, depth: DOOR.depth, archW: DOOR.w, archH: DOOR.h, pointed: POINTED, segments: seg }),
    // ExtrudeGeometry groups: 0 = wall faces, 1 = the reveal inside the arch (kept smooth so it catches the light cleanly)
    [surface(low, { color: '#8a6440', map: plaster, bumpMap: plaster, bumpScale: 0.5 }), surface(low, { color: '#b08352', roughness: 0.8 })]
  );
  scene.add(doorWall);

  const doorTrim = new THREE.Mesh(
    archTrimGeometry({ archW: DOOR.w, archH: DOOR.h, pointed: POINTED, band: 0.11, depth: DOOR.depth + 0.1, segments: seg }),
    surface(low, { color: '#c29a63', roughness: 0.7 })
  );
  doorTrim.position.z = 0.05;
  scene.add(doorTrim);

  const hallMat = surface(low, { color: '#6b4a2d', map: plasterWide });
  const hallLength = 22;
  for (const side of [-1, 1]) {
    const wall = new THREE.Mesh(new THREE.PlaneGeometry(hallLength, HALL.height), hallMat);
    wall.rotation.y = -side * (Math.PI / 2);
    wall.position.set(side * HALL.halfWidth, HALL.height / 2, -DOOR.depth - hallLength / 2);
    scene.add(wall);
  }
  const ceiling = new THREE.Mesh(
    new THREE.PlaneGeometry(HALL.halfWidth * 2, hallLength),
    surface(low, { color: '#3d2916' })
  );
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.set(0, HALL.height, -DOOR.depth - hallLength / 2);
  scene.add(ceiling);

  const innerWall = new THREE.Mesh(
    archWallGeometry({ width: HALL.halfWidth * 2, height: HALL.height, depth: INNER.depth, archW: INNER.w, archH: INNER.h, pointed: POINTED, segments: seg }),
    [surface(low, { color: '#a87848', map: plaster }), surface(low, { color: '#c99560', roughness: 0.8 })]
  );
  innerWall.position.z = INNER.z;
  scene.add(innerWall);

  const innerTrim = new THREE.Mesh(
    archTrimGeometry({ archW: INNER.w, archH: INNER.h, pointed: POINTED, band: 0.09, depth: INNER.depth + 0.08, segments: seg }),
    surface(low, { color: '#d9ae70', roughness: 0.6 })
  );
  innerTrim.position.z = INNER.z + 0.04;
  scene.add(innerTrim);

  /* ---------- light ---------- */
  scene.add(new THREE.HemisphereLight('#ffdcb0', '#140a05', 0.5));

  const key = new THREE.PointLight('#ffb463', 95, 30, 1.7);
  key.position.set(0, 5.4, -6.2);
  scene.add(key);

  const back = new THREE.PointLight('#ff9a3d', 170, 26, 1.8);
  back.position.set(0, 3.2, -16.8);
  scene.add(back);

  const front = new THREE.PointLight('#d8a877', 80, 24, 1.7);
  front.position.set(1.5, 6.2, 5.2);
  scene.add(front);

  const glowTex = glowTexture();

  // the room beyond the second arch is pure light: a glowing end wall with a hot core
  const lightWall = new THREE.Mesh(
    new THREE.PlaneGeometry(HALL.halfWidth * 2, HALL.height),
    new THREE.MeshBasicMaterial({ color: '#c97f38', fog: false, toneMapped: false })
  );
  lightWall.position.set(0, HALL.height / 2, -21.4);
  scene.add(lightWall);

  const sun = glow(glowTex, '#ff8f30', 0.42);
  sun.scale.set(15, 15, 1);
  sun.position.set(0, 2.7, -21.2);
  scene.add(sun);

  // layers of warm haze the camera flies through on its way into the light
  for (const [z, size, opacity] of [[-15.6, 11, 0.1], [-17.6, 13, 0.12], [-19.4, 14, 0.14]]) {
    const layer = glow(glowTex, '#ff8a2a', opacity);
    layer.scale.set(size, size, 1);
    layer.position.set(0, 2.7, z);
    scene.add(layer);
  }

  const haze = glow(glowTex, '#ff9c47', 0.42);
  haze.scale.set(9, 9, 1);
  haze.position.set(0, 2.6, INNER.z - 0.8);
  scene.add(haze);

  // light spilling across the floor towards the viewer
  const pool = glow(glowTex, '#ff9c47', 0.3);
  pool.rotation.x = -Math.PI / 2;
  pool.scale.set(5.4, 11, 1);
  pool.position.set(0, 0.02, 2);
  scene.add(pool);

  /* ---------- the floating photos ---------- */
  function archPhoto(name, width, height) {
    const group = new THREE.Group();
    const texture = stage.photo(name);
    const material = new THREE.MeshBasicMaterial({ map: texture, toneMapped: false });
    revealWhenReady(material, texture);
    const picture = new THREE.Mesh(archPanelGeometry({ width, height, pointed: POINTED, imageRatio: 0.75, segments: seg }), material);
    const rim = new THREE.Mesh(
      archPanelGeometry({ width: width + 0.09, height: height + 0.06, pointed: POINTED, segments: seg }),
      new THREE.MeshBasicMaterial({ color: '#c7a35d', toneMapped: false })
    );
    rim.position.set(0, -0.015, -0.012);
    const halo = glow(glowTex, '#ffb261', 0.34);
    halo.scale.set(width * 2.7, height * 2.1, 1);
    halo.position.set(0, height * 0.5, -0.25);
    group.add(halo, rim, picture);
    group.userData.ready = texture.userData.ready;
    return group;
  }

  const model = archPhoto('portrait-golden-arch', 2.5, 3.6);
  model.position.set(0.2, 0.8, -5.2);
  scene.add(model);

  const sideA = archPhoto('minimalist-black-jumpsuit', 1.35, 1.95);
  sideA.position.set(-1.95, 1.1, -9.4);
  sideA.rotation.y = 0.28;
  scene.add(sideA);

  const sideB = archPhoto('ile-oba-agbada', 1.25, 1.8);
  sideB.position.set(2.1, 1.4, -10.6);
  sideB.rotation.y = -0.3;
  scene.add(sideB);

  const motes = dust({
    count: low ? 90 : 260,
    box: [6.6, 6.4, 24],
    center: [0, 3.3, -5],
    color: '#ffd9a0',
    size: low ? 30 : 26,
  });
  scene.add(motes);

  /* ---------- camera rig ---------- */
  let startZ = 8.4;
  let portrait = false;
  let viewW = 1;
  let viewH = 1;
  const look = new THREE.Vector3();

  function resize(w, h) {
    viewW = w;
    viewH = h;
    const aspect = w / h;
    portrait = aspect < 0.9;
    camera.aspect = aspect;
    camera.fov = portrait ? 60 : 42;
    // pull back until the doorway (plus a little wall) fits the width
    const fit = 2.75 / (Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * aspect);
    startZ = THREE.MathUtils.clamp(fit, 8.4, 13);
    camera.updateProjectionMatrix();
    motes.material.uniforms.uScale.value = (h / 900) * stage.renderer.getPixelRatio();
  }

  function update(time) {
    const p = state.progress;
    const eased = p * p * (3 - 2 * p);
    const z = THREE.MathUtils.lerp(startZ, END_Z, eased);

    // step left around the floating photo, then back to centre for the second arch
    const around = smooth(0.8, -3.0, z) * (1 - smooth(-7.4, -11, z));
    const calm = 1 - smooth(0, 0.5, p);

    camera.position.set(
      -1.72 * around + pointer.sx * 0.34 * calm,
      THREE.MathUtils.lerp(2.5, 2.3, eased) - pointer.sy * 0.2 * calm,
      z
    );
    look.set(camera.position.x * 0.4 + pointer.sx * 0.5 * calm, THREE.MathUtils.lerp(2.75, 2.5, eased), z - 10);
    camera.lookAt(look);

    // editorial framing at rest: doorway sits right of centre on wide screens,
    // high on tall ones. It re-centres as the push-through begins.
    const settle = 1 - smooth(0, 0.3, p);
    const offX = portrait ? 0 : -0.17 * viewW * settle;
    const offY = portrait ? 0.23 * viewH * settle : 0;
    camera.setViewOffset(viewW, viewH, offX, offY, viewW, viewH);

    // the model photo floats, and turns to face you as you pass
    model.position.y = 0.8 + Math.sin(time * 0.7) * 0.07;
    model.position.x = 0.2 + around * 0.35;
    model.rotation.y = Math.sin(time * 0.45) * 0.045 - pointer.sx * 0.07 * calm - around * 0.42;
    model.rotation.x = pointer.sy * 0.03 * calm;

    sideA.position.y = 1.1 + Math.sin(time * 0.55 + 1.7) * 0.09;
    sideB.position.y = 1.4 + Math.sin(time * 0.5 + 3.1) * 0.1;
    sideA.rotation.y = 0.28 + Math.sin(time * 0.3) * 0.06;
    sideB.rotation.y = -0.3 + Math.sin(time * 0.33 + 1) * 0.06;

    motes.material.uniforms.uTime.value = time;
  }

  stage.register({ slot, scene, camera, update, resize });

  return {
    state,
    /** resolves when the hero photo is on the GPU-ready path */
    ready: model.userData.ready,
  };
}
