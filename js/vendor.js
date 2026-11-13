/**
 * One place to import the animation libraries from, so section modules never
 * care where the vendor files live. (Three.js is loaded separately and lazily,
 * see core/three.js, because the lite fallback never needs it.)
 */
import { gsap, ScrollTrigger } from '../vendor/gsap.min.js';
import Lenis from '../vendor/lenis.min.js';

gsap.registerPlugin(ScrollTrigger);

export { gsap, ScrollTrigger, Lenis };
