/**
 * Capability detection. Decides between the full 3D experience and the
 * lightweight fallback, and picks a quality tier for phones.
 *
 * URL switches (handy for testing):
 *   ?lite=1   force the lightweight fallback (no WebGL, no scroll journeys)
 *   ?gl=1     allow software-rendered WebGL (normally treated as "no WebGL")
 *   ?tier=low force phone-quality 3D on a desktop
 */
const params = new URLSearchParams(window.location.search);
const mq = (query) => window.matchMedia(query).matches;

function detectWebGL(allowSoftware) {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2', { failIfMajorPerformanceCaveat: !allowSoftware });
    if (!gl) return false;
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return true;
  } catch {
    return false;
  }
}

const reducedMotion = mq('(prefers-reduced-motion: reduce)');
const coarse = mq('(pointer: coarse)');
const smallScreen = window.innerWidth < 900;
const weakDevice = (navigator.deviceMemory || 8) <= 4 || (navigator.hardwareConcurrency || 8) <= 4;

const webgl = params.get('lite') === '1' ? false : detectWebGL(params.get('gl') === '1');

export const env = {
  reducedMotion,
  coarse,
  /** true when a mouse / trackpad is the main input */
  hover: mq('(hover: hover) and (pointer: fine)'),
  webgl,
  /** lite = static, fast, no WebGL. Used when WebGL is missing or the visitor prefers reduced motion. */
  lite: reducedMotion || !webgl,
  /** 'low' halves texture sizes, particles and pixel density for phones and weak laptops */
  tier: params.get('tier') === 'low' || coarse || smallScreen || weakDevice ? 'low' : 'high',
  get portrait() {
    return window.innerWidth / window.innerHeight < 0.9;
  },
};

/** Called if WebGL dies after start-up: flips the page into its fallback layout. */
export function downgradeToLite() {
  env.lite = true;
  env.webgl = false;
  document.documentElement.classList.remove('full');
  document.documentElement.classList.add('lite');
}
