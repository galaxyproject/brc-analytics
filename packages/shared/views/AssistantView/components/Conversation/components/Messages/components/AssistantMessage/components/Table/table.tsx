import { type ComponentProps, type JSX } from "react";
import { ARIA_LABEL } from "./constants";
import { StyledContainer, StyledTable } from "./table.styles";

/**
 * Renders a markdown table in a bordered box that scrolls sideways when the
 * table is wider than the chat, rather than squeezing its columns. The box
 * takes focus so keyboard users can scroll it too.
 * @param props - Table element props from the markdown renderer.
 * @param props.children - Table content.
 * @param props.className - Class name from the markdown, if any.
 * @returns The table element.
 */
export const Table = ({
  children,
  className,
}: ComponentProps<"table">): JSX.Element => {
  return (
    <StyledContainer aria-label={ARIA_LABEL.TABLE} role="region" tabIndex={0}>
      <StyledTable className={className}>{children}</StyledTable>
    </StyledContainer>
  );
};
