/**
 * The shared WebGL stage.
 *
 * The page has three 3D sections (hero, rooms, gallery) but only ONE WebGL
 * context. Each section registers a "layer" (scene + camera + update fn) and
 * owns an empty `.stage-slot` element. Every frame the stage works out which
 * layer is on screen, moves the canvas into that layer's slot and renders it.
 * Nothing is rendered while no 3D section is visible.
 */
import * as THREE from './three.js';
import { gsap } from '../vendor.js';
import { img } from '../data/studio.js';
import { debounce } from './dom.js';

export function createStage(env) {
  const low = env.tier === 'low';
  const canvas = document.createElement('canvas');
  canvas.className = 'stage-canvas';
  canvas.setAttribute('aria-hidden', 'true');

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: !low,
    alpha: false,
    powerPreference: 'high-performance',
  });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;

  const maxDpr = low ? 1.5 : 1.75;
  let dpr = Math.min(window.devicePixelRatio || 1, maxDpr);
  const minDpr = Math.min(1, dpr);
  renderer.setPixelRatio(dpr);

  const layers = [];
  let active = null;
  let width = 0;
  let height = 0;
  let lost = false;

  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const layer = layers.find((l) => l.slot === entry.target);
        if (layer) layer.inView = entry.isIntersecting;
      }
    },
    { rootMargin: '30% 0px 30% 0px' }
  );

  function resize() {
    if (!active) return;
    const w = active.slot.clientWidth;
    const h = active.slot.clientHeight;
    if (!w || !h) return;
    width = w;
    height = h;
    renderer.setPixelRatio(dpr);
    renderer.setSize(w, h, false);
    active.resize?.(w, h);
  }

  function activate(layer) {
    active = layer;
    if (!layer) {
      canvas.remove();
      return;
    }
    layer.slot.appendChild(canvas);
    resize();
  }

  // --- adaptive resolution: if frames run long, quietly drop pixel density ---
  let slowFrames = 0;
  let fastFrames = 0;
  function adapt(deltaMs) {
    if (deltaMs > 28) slowFrames += 1;
    else fastFrames += 1;
    if (slowFrames + fastFrames < 90) return;
    if (slowFrames > 36 && dpr > minDpr) {
      dpr = Math.max(minDpr, dpr - 0.25);
      resize();
    }
    slowFrames = 0;
    fastFrames = 0;
  }

  /**
   * Which layer should own the canvas right now: the one with the most pixels on
   * screen. (Near a boundary two slots can both be 'in view'; the one that is
   * only about to arrive must not steal the canvas from the one being looked at.)
   */
  function pick() {
    const vh = window.innerHeight;
    let best = null;
    let bestScore = -Infinity;
    for (const layer of layers) {
      if (!layer.inView || !layer.wants()) continue;
      const rect = layer.slot.getBoundingClientRect();
      const visible = Math.min(rect.bottom, vh) - Math.max(rect.top, 0);
      // off-screen slots score by how close they are, so the next one is warmed up early
      const score = visible > 0 ? visible : -Math.min(Math.abs(rect.top - vh), Math.abs(rect.bottom));
      if (score > bestScore || (score === bestScore && layer === active)) {
        best = layer;
        bestScore = score;
      }
    }
    return best;
  }

  gsap.ticker.add((time, deltaMs) => {
    if (lost) return;
    const next = pick();
    if (next !== active) activate(next);
    if (!active || document.hidden) return;
    if (active.slot.clientWidth !== width || active.slot.clientHeight !== height) resize();
    active.update(time, Math.min(deltaMs, 60) / 1000);
    renderer.render(active.scene, active.camera);
    adapt(deltaMs);
  });

  window.addEventListener('resize', debounce(resize, 120));

  canvas.addEventListener('webglcontextlost', (e) => {
    e.preventDefault();
    lost = true;
  });
  canvas.addEventListener('webglcontextrestored', () => {
    lost = false;
  });

  // --- textures: one cache shared by every scene -------------------------
  const textures = new Map();
  const texWidth = low ? 480 : 800;
  const anisotropy = Math.min(low ? 2 : 8, renderer.capabilities.getMaxAnisotropy());

  /**
   * Returns a texture immediately; the photo streams in behind it.
   * `texture.userData.ready` resolves once the image has been decoded.
   */
  function photo(name) {
    if (textures.has(name)) return textures.get(name);
    const texture = new THREE.Texture();
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = anisotropy;
    texture.userData.ready = new Promise((resolve) => {
      const image = new Image();
      image.decoding = 'async';
      image.onload = () => {
        const done = () => {
          texture.image = image;
          texture.needsUpdate = true;
          // upload now (behind the loader / off-screen) rather than on the first frame it is seen
          try {
            renderer.initTexture(texture);
          } catch {
            /* uploaded lazily on first use instead */
          }
          resolve(texture);
        };
        image.decode ? image.decode().then(done, done) : done();
      };
      image.onerror = () => resolve(texture);
      image.src = img(name, texWidth);
    });
    textures.set(name, texture);
    return texture;
  }

  return {
    renderer,
    canvas,
    low,
    photo,
    get size() {
      return { width, height };
    },

    /**
     * @param {{slot:HTMLElement, scene:THREE.Scene, camera:THREE.Camera,
     *          update:(time:number, dt:number)=>void, resize?:(w:number,h:number)=>void,
     *          wants?:()=>boolean}} layer
     */
    register(layer) {
      layer.inView = false;
      layer.wants = layer.wants || (() => true);
      layers.push(layer);
      io.observe(layer.slot);
      // compile this scene's shaders ahead of time so its first frame doesn't stutter
      renderer.compileAsync?.(layer.scene, layer.camera).catch(() => {});
      return layer;
    },
  };
}
