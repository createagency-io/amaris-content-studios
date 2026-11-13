/**
 * One shared, smoothed "tilt" input for the whole page.
 * Desktop: the mouse position. Phones: the gyroscope (device orientation).
 * Values are normalised to -1..1; use `pointer.sx / pointer.sy` for the eased version.
 */
import { gsap } from '../vendor.js?v=5';

export const pointer = {
  x: 0,
  y: 0,
  sx: 0,
  sy: 0,
  /** 'mouse' | 'gyro' */
  source: 'mouse',
  gyroActive: false,
};

const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

function onOrientation(e) {
  if (e.gamma == null || e.beta == null) return;
  pointer.source = 'gyro';
  pointer.gyroActive = true;
  // gamma: left/right tilt. beta: front/back tilt, ~45° is a natural holding angle.
  pointer.x = clamp(e.gamma / 26, -1, 1);
  pointer.y = clamp((e.beta - 45) / 26, -1, 1);
}

/** True on iOS, where motion sensors need an explicit tap-to-allow. */
export const gyroNeedsPermission = () =>
  typeof window.DeviceOrientationEvent !== 'undefined' &&
  typeof window.DeviceOrientationEvent.requestPermission === 'function';

/** Ask for motion access (must be called from a tap on iOS). Resolves true when granted. */
export async function requestGyro() {
  try {
    if (gyroNeedsPermission()) {
      const state = await window.DeviceOrientationEvent.requestPermission();
      if (state !== 'granted') return false;
    }
    window.addEventListener('deviceorientation', onOrientation, { passive: true });
    return true;
  } catch {
    return false;
  }
}

export function initPointer(env) {
  if (env.reducedMotion) return;

  window.addEventListener(
    'pointermove',
    (e) => {
      if (e.pointerType !== 'mouse') return;
      pointer.source = 'mouse';
      pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.y = (e.clientY / window.innerHeight) * 2 - 1;
    },
    { passive: true }
  );

  // Android and other browsers hand over the gyroscope without a prompt
  if (env.coarse && typeof window.DeviceOrientationEvent !== 'undefined' && !gyroNeedsPermission()) {
    window.addEventListener('deviceorientation', onOrientation, { passive: true });
  }

  gsap.ticker.add(() => {
    pointer.sx += (pointer.x - pointer.sx) * 0.06;
    pointer.sy += (pointer.y - pointer.sy) * 0.06;
  });
}
