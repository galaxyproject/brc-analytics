import {
  getBorderBoxSize,
  useResizeObserver,
} from "@databiosphere/findable-ui/lib/hooks/useResizeObserver";
import { JSX, useEffect, useRef, useState } from "react";
import { MAX_LINES, READ_LESS_TEXT, READ_MORE_TEXT } from "./constants";
import { Props } from "./types";
import { calculateTruncation, renderText } from "./utils";
import { StyledButtonBase, StyledSpan } from "./truncatedText.styles";

/**
 * A component that truncates text to a specified number of lines and displays
 * an inline "Read more" link. Uses canvas for precise text measurement.
 * @remarks Only plain strings are supported. Mixed content (e.g., JSX with
 * `<strong>`, `<a>`, etc.) will not work as canvas `measureText()` cannot
 * measure React elements.
 * @param props - Component props.
 * @param props.children - Text to display and potentially truncate.
 * @param props.maxLines - Maximum number of lines to display before truncation.
 * @returns Truncated text component.
 */
export const TruncatedText = ({
  children: text,
  maxLines = MAX_LINES,
}: Props): JSX.Element => {
  const containerRef = useRef<HTMLSpanElement>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [truncatedText, setTruncatedText] = useState<string | null>(null);

  const shouldTruncate = truncatedText !== null;

  // Observe container width changes.
  const { width } = useResizeObserver(containerRef, getBorderBoxSize) || {};

  // Calculate truncation when text or container width changes.
  // CSS line-clamp handles visual truncation until JS is ready.
  useEffect(() => {
    const container = containerRef.current;

    if (!container || !width) return;

    setTruncatedText(calculateTruncation(text, container, width, maxLines));
    setIsReady(true);
  }, [maxLines, text, width]);

  return (
    <StyledSpan ref={containerRef} clamp={isReady ? 0 : maxLines}>
      {renderText(text, truncatedText, isExpanded)}
      {shouldTruncate && (
        <StyledButtonBase onClick={() => setIsExpanded((prev) => !prev)}>
          {isExpanded ? READ_LESS_TEXT : READ_MORE_TEXT}
        </StyledButtonBase>
      )}
    </StyledSpan>
  );
};
