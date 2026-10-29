import { FONT } from "@databiosphere/findable-ui/lib/styles/common/constants/font";
import { PALETTE } from "@databiosphere/findable-ui/lib/styles/common/constants/palette";
import { SHADOWS } from "@databiosphere/findable-ui/lib/styles/common/constants/shadows";
import { bpDown1024 } from "@databiosphere/findable-ui/lib/styles/common/mixins/breakpoints";
import styled from "@emotion/styled";

export const Layout = styled.div`
  align-items: start;
  display: grid;
  gap: 32px 48px;
  grid-template-columns: minmax(0, 7fr) minmax(0, 3fr);
  margin: 0 auto;
  max-width: 1136px;
  width: 100%;

  ${bpDown1024} {
    grid-template-columns: minmax(0, 1fr);
  }
`;

export const ChartFrame = styled.div`
  aspect-ratio: 1;
  justify-self: center;
  max-width: 800px;
  position: relative;
  width: 100%;

  ${bpDown1024} {
    max-width: 560px;
  }

  svg {
    display: block;
    height: 100%;
    overflow: visible;
    width: 100%;
  }

  path,
  text {
    transition: opacity 150ms ease;
  }

  path {
    cursor: pointer;
  }

  @media (prefers-reduced-motion: reduce) {
    path,
    text {
      transition: none;
    }
  }

  path:focus,
  circle:focus {
    outline: none;
  }

  path:focus-visible,
  circle:focus-visible {
    stroke: ${PALETTE.PRIMARY_MAIN};
    stroke-width: 3px;
  }
`;

export const Tooltip = styled.div`
  background-color: ${PALETTE.COMMON_WHITE};
  border-radius: 8px;
  box-shadow: ${SHADOWS["02"]};
  color: ${PALETTE.INK_MAIN};
  display: grid;
  font: ${FONT.BODY_SMALL_400};
  gap: 2px;
  left: 0;
  max-width: 240px;
  opacity: 0;
  padding: 8px 12px;
  pointer-events: none;
  position: absolute;
  top: 0;
  transition: opacity 150ms ease;
  z-index: 1;

  strong {
    font: ${FONT.BODY_SMALL_500};
  }

  span {
    color: ${PALETTE.INK_LIGHT};
  }
`;

export const LoadMessage = styled.p`
  color: ${PALETTE.INK_LIGHT};
  font: ${FONT.BODY_400};
  margin: 0;
  padding-top: 45%;
  text-align: center;
`;

// A pale ring where the chart will be, so the space doesn't read as broken
// while the chart and tree download.
export const Placeholder = styled.div`
  border: 24px solid ${PALETTE.SMOKE_MAIN};
  border-radius: 50%;
  box-sizing: border-box;
  height: 100%;
  opacity: 0.6;
  width: 100%;
`;

export const Panel = styled.div`
  display: grid;
  gap: 12px;
`;

export const PanelPaper = styled.div`
  background-color: ${PALETTE.COMMON_WHITE};
  border: 1px solid ${PALETTE.SMOKE_MAIN};
  border-radius: 8px;
  box-shadow: ${SHADOWS["01"]};
  overflow: hidden;
`;

export const PanelHeader = styled.div`
  border-bottom: 1px solid ${PALETTE.SMOKE_MAIN};
  display: grid;
  gap: 4px;
  padding: 16px;
`;

export const Lineage = styled.ol`
  display: flex;
  flex-wrap: wrap;
  gap: 2px 4px;
  list-style: none;
  margin: 0 0 4px;
  padding: 0;

  li {
    align-items: center;
    display: flex;
    gap: 4px;
  }

  li + li::before {
    color: ${PALETTE.INK_LIGHT};
    content: "/";
    font: ${FONT.BODY_SMALL_400};
  }
`;

export const TextButton = styled.button`
  background: none;
  border: none;
  border-radius: 4px;
  color: ${PALETTE.PRIMARY_MAIN};
  cursor: pointer;
  font: ${FONT.BODY_SMALL_400};
  padding: 0 2px;

  &:hover {
    text-decoration: underline;
  }

  &:focus-visible {
    outline: 2px solid ${PALETTE.PRIMARY_MAIN};
    outline-offset: 1px;
  }
`;

export const Title = styled.h3`
  color: ${PALETTE.INK_MAIN};
  font: ${FONT.HEADING_XSMALL};
  margin: 0;
  overflow-wrap: anywhere;
`;

export const Meta = styled.p`
  color: ${PALETTE.INK_LIGHT};
  font: ${FONT.BODY_SMALL_400};
  margin: 0;
`;

export const LinkRow = styled.div`
  align-items: center;
  border-bottom: 1px solid ${PALETTE.SMOKE_MAIN};
  display: flex;
  font: ${FONT.BODY_400};
  gap: 8px;
  padding: 12px 16px;

  svg {
    color: ${PALETTE.INK_LIGHT};
    flex: none;
  }
`;

export const ListHeader = styled.div`
  align-items: center;
  display: flex;
  justify-content: space-between;
  box-sizing: border-box;
  min-height: 52px;
  padding: 8px 8px 8px 16px;

  h4 {
    color: ${PALETTE.INK_MAIN};
    font: ${FONT.BODY_LARGE_500};
    margin: 0;
    outline: none;
  }
`;

export const List = styled.ul`
  list-style: none;
  margin: 0;
  max-height: 680px;
  overflow-y: auto;
  padding: 0;

  ${bpDown1024} {
    max-height: none;
  }
`;

export const RowButton = styled.button`
  align-items: center;
  background: none;
  border: none;
  border-top: 1px solid ${PALETTE.SMOKE_MAIN};
  box-sizing: border-box;
  color: ${PALETTE.INK_MAIN};
  cursor: pointer;
  display: flex;
  font: ${FONT.BODY_LARGE_400};
  gap: 8px;
  justify-content: space-between;
  padding: 10px 8px 10px 16px;
  text-align: left;
  width: 100%;

  &:hover {
    background-color: ${PALETTE.SMOKE_LIGHTEST};
  }

  &:focus-visible {
    outline: 2px solid ${PALETTE.PRIMARY_MAIN};
    outline-offset: -2px;
  }

  .name {
    font: ${FONT.BODY_LARGE_500};
    overflow-wrap: anywhere;
  }

  .count {
    color: ${PALETTE.INK_LIGHT};
    margin-left: 8px;
    white-space: nowrap;
  }

  svg {
    color: ${PALETTE.INK_LIGHT};
    flex: none;
  }
`;

export const Hint = styled.p`
  color: ${PALETTE.INK_LIGHT};
  font: ${FONT.BODY_SMALL_400};
  margin: 0;
  padding: 0 4px;
`;
