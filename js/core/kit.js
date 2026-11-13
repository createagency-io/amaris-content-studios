/**
 * Three.js building blocks shared by the hero, rooms and gallery scenes:
 * arch geometry, plaster / glow textures, floating dust and framed photos.
 */
import * as THREE from './three.js?v=5';
import { gsap } from '../vendor.js?v=5';

/* ------------------------------------------------------------------ */
/* Arches                                                              */
/* ------------------------------------------------------------------ */

/**
 * Points along the curved head of an arch, from the left springing point
 * over the apex to the right one. `pointed` 0 = round Roman arch,
 * higher values pull the apex up into a gothic / Moorish point.
 */
export function archPoints(width, height, pointed = 0, segments = 22) {
  const r = width / 2;
  const c = pointed * r;
  const R = r + c;
  const rise = Math.sqrt(R * R - c * c);
  const spring = height - rise;
  const endAngle = Math.acos(-c / R);
  const left = [];
  for (let i = 0; i <= segments; i++) {
    const a = Math.PI + (endAngle - Math.PI) * (i / segments);
    left.push(new THREE.Vector2(c + R * Math.cos(a), spring + R * Math.sin(a)));
  }
  const right = left.slice(0, -1).reverse().map((p) => new THREE.Vector2(-p.x, p.y));
  return [...left, ...right];
}

/**
 * ExtrudeGeometry gives every side quad its own flat normal, which shows up as
 * stripes around a curved arch. This averages the normals of side vertices that
 * share a position so the reveal of the arch shades as one smooth surface.
 * (Group 0 = the flat faces, group 1 = the extruded sides.)
 */
function smoothSides(geo) {
  const side = geo.groups.find((g) => g.materialIndex === 1);
  if (!side) return geo;
  const pos = geo.attributes.position;
  const nor = geo.attributes.normal;
  const sums = new Map();
  const keyOf = (i) => `${pos.getX(i).toFixed(3)}|${pos.getY(i).toFixed(3)}|${pos.getZ(i).toFixed(3)}`;
  const end = side.start + side.count;
  for (let i = side.start; i < end; i++) {
    const key = keyOf(i);
    const sum = sums.get(key) || [0, 0, 0];
    sum[0] += nor.getX(i);
    sum[1] += nor.getY(i);
    sum[2] += nor.getZ(i);
    sums.set(key, sum);
  }
  for (let i = side.start; i < end; i++) {
    const [x, y, z] = sums.get(keyOf(i));
    const len = Math.hypot(x, y, z) || 1;
    nor.setXYZ(i, x / len, y / len, z / len);
  }
  nor.needsUpdate = true;
  return geo;
}

/** A wall (width × height × depth) with an arched doorway cut through it. Front face sits at z = 0. */
export function archWallGeometry({ width, height, depth, archW, archH, pointed = 0, segments = 22 }) {
  const shape = new THREE.Shape();
  shape.moveTo(-width / 2, 0);
  shape.lineTo(-archW / 2, 0);
  for (const p of archPoints(archW, archH, pointed, segments)) shape.lineTo(p.x, p.y);
  shape.lineTo(archW / 2, 0);
  shape.lineTo(width / 2, 0);
  shape.lineTo(width / 2, height);
  shape.lineTo(-width / 2, height);
  shape.closePath();
  const geo = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false });
  geo.translate(0, 0, -depth);
  return smoothSides(geo);
}

/** The moulding that frames an arched doorway (a band following the arch). */
export function archTrimGeometry({ archW, archH, pointed = 0, band = 0.14, depth = 0.9, segments = 22 }) {
  // the inner edge sits a hair inside the opening so the moulding lines the reveal
  // of the wall instead of fighting it for the same surface
  const lip = 0.014;
  const inW = archW - lip * 2;
  const inner = archPoints(inW, archH - lip, pointed, segments);
  const outer = archPoints(archW + band * 2, archH + band, pointed, segments);
  const shape = new THREE.Shape();
  shape.moveTo(-archW / 2 - band, 0);
  for (const p of outer) shape.lineTo(p.x, p.y);
  shape.lineTo(archW / 2 + band, 0);
  shape.lineTo(inW / 2, 0);
  for (const p of [...inner].reverse()) shape.lineTo(p.x, p.y);
  shape.lineTo(-inW / 2, 0);
  shape.closePath();
  const geo = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false });
  geo.translate(0, 0, -depth);
  // one material for the whole moulding
  smoothSides(geo);
  geo.clearGroups();
  return geo;
}

/**
 * A flat arch-shaped panel whose UVs "cover" it with an image of the given
 * aspect ratio (like CSS object-fit: cover). Base sits at y = 0.
 */
export function archPanelGeometry({ width, height, pointed = 0, imageRatio = 0.75, segments = 22 }) {
  const shape = new THREE.Shape();
  shape.moveTo(-width / 2, 0);
  for (const p of archPoints(width, height, pointed, segments)) shape.lineTo(p.x, p.y);
  shape.lineTo(width / 2, 0);
  shape.closePath();
  const geo = new THREE.ShapeGeometry(shape);
  coverUVs(geo, width, height, imageRatio, -width / 2, 0);
  return geo;
}

/** Rewrites a flat geometry's UVs so a texture covers its bounding box without stretching. */
export function coverUVs(geo, width, height, imageRatio, originX = -width / 2, originY = -height / 2) {
  const pos = geo.attributes.position;
  const uv = geo.attributes.uv;
  const panelRatio = width / height;
  let su = 1;
  let sv = 1;
  if (panelRatio > imageRatio) sv = imageRatio / panelRatio;
  else su = panelRatio / imageRatio;
  for (let i = 0; i < pos.count; i++) {
    const u = (pos.getX(i) - originX) / width;
    const v = (pos.getY(i) - originY) / height;
    uv.setXY(i, 0.5 + (u - 0.5) * su, 0.5 + (v - 0.5) * sv);
  }
  uv.needsUpdate = true;
  return geo;
}

/* ------------------------------------------------------------------ */
/* Procedural textures                                                 */
/* ------------------------------------------------------------------ */

/** Soft, tileable plaster noise. Multiplied over wall colours for a hand-finished look. */
export function plasterTexture(size = 256) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const g = canvas.getContext('2d');
  g.fillStyle = '#d9d9d9';
  g.fillRect(0, 0, size, size);
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
  for (let i = 0; i < 520; i++) {
    const x = rnd() * size;
    const y = rnd() * size;
    const r = 5 + rnd() * 34;
    const v = rnd() > 0.5 ? 255 : 150;
    const a = 0.035 + rnd() * 0.07;
    for (const ox of [-size, 0, size]) {
      for (const oy of [-size, 0, size]) {
        const grad = g.createRadialGradient(x + ox, y + oy, 0, x + ox, y + oy, r);
        grad.addColorStop(0, `rgba(${v},${v},${v},${a})`);
        grad.addColorStop(1, `rgba(${v},${v},${v},0)`);
        g.fillStyle = grad;
        g.fillRect(x + ox - r, y + oy - r, r * 2, r * 2);
      }
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** Radial falloff used for light pools, halos and glows. */
export function glowTexture(size = 128) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const g = canvas.getContext('2d');
  const grad = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.25, 'rgba(255,255,255,0.55)');
  grad.addColorStop(0.6, 'rgba(255,255,255,0.12)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** An additive glow quad (never fogged, never writes depth). */
export function glow(texture, color, opacity = 1) {
  return new THREE.Mesh(
    new THREE.PlaneGeometry(1, 1),
    new THREE.MeshBasicMaterial({
      map: texture,
      color,
      opacity,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      fog: false,
      toneMapped: false,
    })
  );
}

/** Crisp text drawn to a canvas and mapped on a plane (room signs above the arches). */
export function labelPlane({ text, sub = '', color = '#c7a35d', height = 0.34, font = "300 64px 'Fraunces', Georgia, serif" }) {
  const canvas = document.createElement('canvas');
  const g = canvas.getContext('2d');
  const pad = 24;
  g.font = font;
  const subFont = "500 22px 'Outfit', system-ui, sans-serif";
  const textW = g.measureText(text).width;
  g.font = subFont;
  const spaced = sub.toUpperCase().split('').join('  ');
  const subW = sub ? g.measureText(spaced).width : 0;
  canvas.width = Math.ceil(Math.max(textW, subW) + pad * 2);
  canvas.height = sub ? 138 : 96;
  g.clearRect(0, 0, canvas.width, canvas.height);
  g.textAlign = 'center';
  g.textBaseline = 'alphabetic';
  g.fillStyle = color;
  if (sub) {
    g.font = subFont;
    g.globalAlpha = 0.85;
    g.fillText(spaced, canvas.width / 2, 34);
    g.globalAlpha = 1;
  }
  g.font = font;
  g.fillText(text, canvas.width / 2, sub ? 112 : 70);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  const ratio = canvas.width / canvas.height;
  const h = sub ? height * 1.45 : height;
  return new THREE.Mesh(
    new THREE.PlaneGeometry(h * ratio, h),
    new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, toneMapped: false })
  );
}

/* ------------------------------------------------------------------ */
/* Dust motes                                                          */
/* ------------------------------------------------------------------ */

/**
 * Floating dust drifting inside a box. Animated entirely on the GPU.
 * Call `points.material.uniforms.uTime.value = time` each frame.
 */
export function dust({ count = 200, box = [6, 6, 20], center = [0, 3, -6], color = '#ffd9a0', size = 26, opacity = 0.9 }) {
  const positions = new Float32Array(count * 3);
  const seeds = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    positions[i * 3] = center[0] + (Math.random() - 0.5) * box[0];
    positions[i * 3 + 1] = center[1] + (Math.random() - 0.5) * box[1];
    positions[i * 3 + 2] = center[2] + (Math.random() - 0.5) * box[2];
    seeds[i * 3] = Math.random();
    seeds[i * 3 + 1] = Math.random();
    seeds[i * 3 + 2] = Math.random();
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 3));
  const material = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uTime: { value: 0 },
      uSize: { value: size },
      uScale: { value: 1 },
      uOpacity: { value: opacity },
      uColor: { value: new THREE.Color(color) },
    },
    vertexShader: /* glsl */ `
      uniform float uTime;
      uniform float uSize;
      uniform float uScale;
      attribute vec3 aSeed;
      varying float vAlpha;
      void main() {
        vec3 p = position;
        p.x += sin(uTime * (0.10 + aSeed.x * 0.16) + aSeed.y * 6.283) * 0.45;
        p.y += sin(uTime * (0.08 + aSeed.y * 0.14) + aSeed.z * 6.283) * 0.38;
        p.z += cos(uTime * (0.07 + aSeed.z * 0.12) + aSeed.x * 6.283) * 0.45;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        float dist = max(-mv.z, 0.1);
        gl_PointSize = uSize * uScale * (0.35 + aSeed.x * 0.9) / dist;
        float twinkle = 0.35 + 0.65 * (0.5 + 0.5 * sin(uTime * (0.5 + aSeed.y) + aSeed.z * 40.0));
        vAlpha = twinkle * smoothstep(0.4, 2.2, dist) * (1.0 - smoothstep(14.0, 26.0, dist));
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      uniform float uOpacity;
      varying float vAlpha;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        float a = smoothstep(0.5, 0.0, d);
        gl_FragColor = vec4(uColor, a * a * vAlpha * uOpacity);
      }
    `,
  });
  const points = new THREE.Points(geo, material);
  points.frustumCulled = false;
  return points;
}

/* ------------------------------------------------------------------ */
/* Photos                                                              */
/* ------------------------------------------------------------------ */

/** Fades a photo material up from black once its texture has arrived. */
export function revealWhenReady(material, texture, to = 0xffffff) {
  material.color.set(0x050302);
  texture.userData.ready.then(() => {
    const target = new THREE.Color(to);
    gsap.to(material.color, { r: target.r, g: target.g, b: target.b, duration: 0.9, ease: 'power2.out' });
  });
}

/**
 * A photo in a slim frame, built around its centre.
 * Returns a Group; `group.userData.photo` is the picture mesh.
 */
export function framedPhoto({ texture, width, ratio, frameColor = '#c7a35d', border = 0.045, depth = 0.05 }) {
  const height = width / ratio;
  const group = new THREE.Group();
  const frame = new THREE.Mesh(
    new THREE.BoxGeometry(width + border * 2, height + border * 2, depth),
    new THREE.MeshStandardMaterial({ color: frameColor, roughness: 0.45, metalness: 0.35 })
  );
  frame.position.z = -depth / 2;
  const material = new THREE.MeshBasicMaterial({ map: texture, toneMapped: false });
  const picture = new THREE.Mesh(new THREE.PlaneGeometry(width, height), material);
  picture.position.z = 0.004;
  revealWhenReady(material, texture);
  group.add(frame, picture);
  group.userData.photo = picture;
  group.userData.size = { width, height };
  return group;
}

/** Lambert on phones (cheap), Standard everywhere else (prettier). */
export function surface(low, params) {
  if (low) {
    const { roughness, metalness, bumpMap, bumpScale, ...rest } = params;
    return new THREE.MeshLambertMaterial(rest);
  }
  return new THREE.MeshStandardMaterial({ roughness: 0.92, metalness: 0, ...params });
}
