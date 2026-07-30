import { GRID_SIZE } from "./constants";

/**
 * Calculates the grid size based on the height and count.
 * @param height - Section height.
 * @param patternCount - Pattern count; vertical repeat of grid pattern.
 * @returns grid size.
 */
export function calculateGridSize(
  height = GRID_SIZE * 2,
  patternCount?: number
): number {
  if (height <= GRID_SIZE * 2) {
    return height / (patternCount || 2);
  }
  return height / (patternCount || 3);
}

/**
 * Returns element href for the given ID.
 * @param id - Element ID.
 * @returns href.
 */
export function getElementHref(id: string): string {
  return `#${id}`;
}

/**
 * Returns fill URL for the given ID.
 * @param id - ID.
 * @returns fill URL.
 */
export function getFillUrl(id: string): string {
  return `url(#${id})`;
}

/**
 * Returns the viewBox attribute for an SVG element.
 * @param width - SVG width.
 * @param height - SVG height.
 * @returns view box.
 */
export function getViewBox(width: number, height: number): string {
  return `0 0 ${width} ${height}`;
}
