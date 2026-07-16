import {
  GRID_SIZE,
  SHAPE_HEIGHT,
  SHAPE_WIDTH,
  X_POSITION,
  Y_POSITION,
} from "./constants";

/**
 * Returns the path for the animateMotion element of the blue rectangle.
 * @param gridSize - Grid size.
 * @returns animate motion path.
 */
export function getAnimateMotionPathBlueRect(gridSize: number): string {
  return `M 0,0 L -${X_POSITION.BLUE_RECT},0 L ${
    gridSize - X_POSITION.BLUE_RECT - SHAPE_WIDTH.BLUE_RECT
  },0 L 0,0`;
}

/**
 * Returns the path for the animateMotion element of the yellow rectangle.
 * @param gridSize - Grid size.
 * @returns animate motion path.
 */
export function getAnimateMotionPathYellowRect(gridSize: number): string {
  return `M 0,0 L 0,${
    gridSize - Y_POSITION.YELLOW_RECT - SHAPE_HEIGHT.YELLOW_RECT
  } L 0,-${Y_POSITION.YELLOW_RECT} L 0,0`;
}

/**
 * Returns the transform for the animateMotion element of the blue or coral pink circle.
 * @param pos - Position.
 * @param gridSize - Grid size.
 * @param gridShift - Grid shift.
 * @returns animate motion transform.
 */
export function getAnimateMotionTransformCircle(
  pos: number,
  gridSize: number,
  gridShift = 0
): string {
  return `${pos} ${gridSize / 2 + gridSize * gridShift} ${gridSize / 2}`;
}

/**
 * Returns the starting x position for the blue or coral pink circle.
 * @param gridSize - Grid size.
 * @param angle - Angle.
 * @returns x position.
 */
export function calculateCircleXPosition(
  gridSize: number,
  angle: number
): number {
  return gridSize / 2 + (gridSize / 2) * Math.cos(degreesToRadians(angle));
}

/**
 * Returns the starting y position for the blue or coral pink circle.
 * @param gridSize - Grid size.
 * @param angle - Angle.
 * @returns y position.
 */
export function calculateCircleYPosition(
  gridSize: number,
  angle: number
): number {
  return gridSize / 2 - (gridSize / 2) * Math.sin(degreesToRadians(angle));
}

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
 * Returns radians from degrees.
 * @param angle - Angle.
 * @returns radians.
 */
function degreesToRadians(angle: number): number {
  return (angle * Math.PI) / 180;
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
