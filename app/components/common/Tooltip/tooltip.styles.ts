import styled from "@emotion/styled";

/**
 * Wrapper that gives MUI Tooltip a single ref-able child. `inline-flex` keeps
 * the wrapper inline-level (like a bare span) while shrink-wrapping its content
 * so the tooltip anchors to the content rather than the full cell width — e.g.
 * in the collapsed (vertical) table row where the cell stretches to full width.
 */
export const StyledSpan = styled.span`
  display: inline-flex;
  min-width: 0;
`;
