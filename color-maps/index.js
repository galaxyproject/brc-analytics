/**
 * Index file for color maps
 * Exports all color palettes from crameri.js and tol.js
 */

import * as crameri from "./crameri";
import * as tol from "./tol";

export { crameri };
export { tol };

// Individual exports from tol.js for direct access
export {
  bright,
  high_contrast,
  vibrant,
  muted,
  medium_contrast,
  light,
  dark,
  pale,
} from "./tol";

export {
  cyclic_vik,
  cyclic_roma,
  cyclic_roma_vibrant,
  vik,
  roma,
} from "./crameri";
