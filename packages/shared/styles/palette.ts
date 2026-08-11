import { palette } from "@databiosphere/findable-ui/lib/theme/common/palette";

// findable-ui's exported palette doesn't surface the `smoke.lightest` shade in
// its type (PaletteOptions), so assert the concrete shape to read the hex
// token. Used as the page background in pages' static theme options — a hex
// (not the CSS-var token) so MUI can derive its channel tokens.
export const SMOKE_LIGHTEST = (palette as { smoke: { lightest: string } }).smoke
  .lightest;
