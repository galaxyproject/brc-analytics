// Type-only, so it is erased at compile time and does not pull vega into the
// page chunk; the runtime import stays the dynamic one in cohortGeography.
import type { View } from "vega";

export type MapImageFormat = "png" | "svg";

// The slice of a vega View the export needs. Narrowed so the helpers can be
// tested against a stub rather than a renderer jsdom cannot run.
export type MapImageView = Pick<View, "background" | "runAsync" | "toImageURL">;

export interface MapImageOption {
  format: MapImageFormat;
  label: string;
}

export const MAP_IMAGE_OPTIONS: MapImageOption[] = [
  { format: "png", label: "PNG image" },
  { format: "svg", label: "SVG vector" },
];

// Twice the on-screen size, so the PNG stays sharp on a slide or a retina
// screen. SVG is resolution-independent and ignores the factor.
export const PNG_SCALE = 2;

// The live map is transparent so it sits on the card. A downloaded figure has
// no card behind it, and dark legend text on a transparent PNG disappears in
// any viewer with a dark background.
export const EXPORT_BACKGROUND = "#ffffff";

// Long enough for the browser to start the download before the blob goes
// away; revoking synchronously after click() cancels it in some browsers.
const REVOKE_DELAY_MS = 1000;

// Job ids come from the ?job= parameter as well as from the API, so they are
// reduced to characters that are safe in a filename on every OS. Splitting on
// the runs and rejoining also trims separators from the ends without a second,
// backtracking-prone pattern.
const FILENAME_SEPARATORS = /\W+/;
const MAX_JOB_ID_LENGTH = 64;

/**
 * The download name for a map image, e.g. "logan-fe6f66a714dcbec8-map.png".
 * @param jobId - Job the map belongs to, if known.
 * @param format - Image format.
 * @returns A filesystem-safe filename.
 */
export function mapImageFilename(
  jobId: string | null | undefined,
  format: MapImageFormat
): string {
  const safeId = (jobId ?? "")
    .split(FILENAME_SEPARATORS)
    .filter(Boolean)
    .join("-")
    .slice(0, MAX_JOB_ID_LENGTH);
  return safeId ? `logan-${safeId}-map.${format}` : `logan-map.${format}`;
}

/**
 * Render the current view to an image URL on an opaque background.
 *
 * The background is swapped on the live view because toImageURL takes it from
 * there and offers no override. It is restored, and the view re-run, even if
 * the render throws, so a failed export cannot leave the map painted white.
 * @param view - The embedded vega view.
 * @param format - Image format.
 * @returns A data URL (PNG) or a blob URL (SVG).
 */
export async function renderMapImage(
  view: MapImageView,
  format: MapImageFormat
): Promise<string> {
  const previous = view.background();
  view.background(EXPORT_BACKGROUND);
  try {
    return await view.toImageURL(format, format === "png" ? PNG_SCALE : 1);
  } finally {
    view.background(previous);
    await view.runAsync();
  }
}

/**
 * Render the map and hand it to the browser as a download.
 * @param view - The embedded vega view.
 * @param format - Image format.
 * @param jobId - Job the map belongs to, if known, for the filename.
 * @returns Resolves once the download has been triggered.
 */
export async function downloadMapImage(
  view: MapImageView,
  format: MapImageFormat,
  jobId: string | null | undefined
): Promise<void> {
  const url = await renderMapImage(view, format);
  const link = document.createElement("a");
  link.download = mapImageFilename(jobId, format);
  link.href = url;
  // Attached because older Firefox ignores click() on a detached anchor.
  document.body.appendChild(link);
  link.click();
  link.remove();
  if (url.startsWith("blob:")) {
    setTimeout(() => URL.revokeObjectURL(url), REVOKE_DELAY_MS);
  }
}
