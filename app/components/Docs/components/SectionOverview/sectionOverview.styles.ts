import styled from "@emotion/styled";
import { bpUpSm } from "@databiosphere/findable-ui/lib/styles/common/mixins/breakpoints";
import { PALETTE } from "@databiosphere/findable-ui/lib/styles/common/constants/palette";

export const GroupOverview = styled.div`
  .MuiDivider-root,
  .MuiTypography-heading {
    grid-column: 1 / -1;
  }

  .MuiDivider-root {
    margin: 32px 0;
  }
`;

export const GroupLinks = styled.div`
  margin-top: 8px;

  ${bpUpSm} {
    display: grid;
    gap: 0 64px;
    grid-auto-columns: 1fr;

    ul + ul {
      grid-column: 2;
    }
  }
`;

export const StyledUnorderedList = styled("ul")`
  list-style-position: inside;
  padding-left: 0 !important;

  li {
    margin: 4px 0;
    padding-left: 24px; // required for list-style-position: inside; allows for market to be positioned inside the list item.
    text-indent: -15px; // required for list-style-position: inside; centering marker; half of the 24px width and half marker width @ 6px.

    > * {
      margin-left: -6px; // required for list-style-position: inside; assists with vertical alignment of list item; difference between indent and padding adjustments and half of the marker width.
    }

    &::marker {
      color: ${PALETTE.PRIMARY_MAIN};
    }
  }
`;
