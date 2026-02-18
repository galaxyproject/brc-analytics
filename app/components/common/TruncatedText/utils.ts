import { READ_MORE_TEXT } from "./constants";

// Cached canvas context for text measurement.
let cachedCtx: CanvasRenderingContext2D | null = null;

/**
 * Calculates line breaks for the given text based on word wrapping.
 * @param ctx - Canvas 2D context with font set.
 * @param text - The text to break into lines.
 * @param maxWidth - Maximum width per line in pixels.
 * @returns Array of lines.
 */
function calculateLineBreaks(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const testWidth = ctx.measureText(testLine).width;

    if (testWidth > maxWidth) {
      if (currentLine) {
        // Push current line and start new line with this word.
        lines.push(currentLine);
        currentLine = word;
      } else {
        // Single word is too long for a line - push it anyway to avoid infinite loop.
        lines.push(word);
      }
    } else {
      currentLine = testLine;
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
}

/**
 * Calculates the truncated text that fits within the specified number of lines,
 * leaving room for the "... Read more" suffix.
 * @param text - The full text to truncate.
 * @param container - The container element for font style computation.
 * @param containerWidth - The width of the container in pixels.
 * @param maxLines - Maximum number of lines to display.
 * @returns The truncated text, or null if no truncation is needed.
 */
export function calculateTruncation(
  text: string,
  container: HTMLElement,
  containerWidth: number,
  maxLines: number
): string | null {
  // Guard for edge cases.
  if (!text || maxLines < 1) return null;

  const computed = getComputedStyle(container);
  const font = `${computed.fontWeight} ${computed.fontSize} ${computed.fontFamily}`;

  // Get cached canvas context for text measurement.
  const ctx = getCanvasContext();

  if (!ctx) return null;
  ctx.font = font;

  // Measure the "... Read more" suffix width.
  const suffixText = `... ${READ_MORE_TEXT}`;
  const suffixWidth = ctx.measureText(suffixText).width;

  // Calculate line breaks using word wrapping.
  const lines = calculateLineBreaks(ctx, text, containerWidth);

  // Check if truncation is needed.
  if (lines.length <= maxLines) {
    return null;
  }

  // Build the text for the first (maxLines - 1) lines.
  const fullLines = lines.slice(0, maxLines - 1);
  const lastLine = lines[maxLines - 1];

  // Find truncation point on the last visible line to fit the suffix.
  const maxLastLineWidth = containerWidth - suffixWidth;
  const truncatedLastLine = truncateLineToFit(ctx, lastLine, maxLastLineWidth);

  return [...fullLines, truncatedLastLine].join(" ").trimEnd();
}

/**
 * Returns a cached canvas 2D context for text measurement.
 * @returns Canvas 2D context, or null if unavailable.
 */
function getCanvasContext(): CanvasRenderingContext2D | null {
  if (!cachedCtx) {
    const canvas = document.createElement("canvas");
    cachedCtx = canvas.getContext("2d");
  }
  return cachedCtx;
}

/**
 * Returns the display text based on expansion state and truncation.
 * @param text - The full text.
 * @param truncatedText - The truncated text, or null if no truncation needed.
 * @param isExpanded - Whether the text is expanded.
 * @returns The text to display.
 */
export function renderText(
  text: string,
  truncatedText: string | null,
  isExpanded: boolean
): string {
  if (isExpanded || truncatedText === null) {
    return text;
  }
  return `${truncatedText}...`;
}

/**
 * Truncates a line of text to fit within a maximum width using binary search
 * for performance.
 * @param ctx - Canvas 2D context with font set.
 * @param line - The line of text to truncate.
 * @param maxWidth - Maximum width in pixels.
 * @returns The truncated line.
 */
function truncateLineToFit(
  ctx: CanvasRenderingContext2D,
  line: string,
  maxWidth: number
): string {
  // If it already fits, return as-is.
  if (ctx.measureText(line).width <= maxWidth) {
    return line;
  }

  // Binary search to find the maximum length that fits.
  let low = 0;
  let high = line.length;

  while (low < high) {
    const mid = Math.ceil((low + high) / 2);
    if (ctx.measureText(line.slice(0, mid)).width > maxWidth) {
      high = mid - 1;
    } else {
      low = mid;
    }
  }

  // Trim to last word boundary for cleaner truncation.
  const truncated = line.slice(0, low);
  const lastSpace = truncated.lastIndexOf(" ");

  return lastSpace > 0 ? truncated.slice(0, lastSpace) : truncated;
}
