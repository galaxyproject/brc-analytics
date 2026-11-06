import { Title } from "@databiosphere/findable-ui/lib/components/common/Title/title";
import {
  bpDownSm,
  bpUpSm,
} from "@databiosphere/findable-ui/lib/styles/common/mixins/breakpoints";
import styled from "@emotion/styled";

// The title-only header of the other top-level data pages, as the Priority
// Pathogens page lays it out.
export const StyledGrid = styled("div")`
  align-content: flex-start;
  display: grid;
  flex: 1;
  grid-template-columns: 1fr;
  min-width: 0;
  padding-bottom: 24px;

  ${bpUpSm} {
    margin-left: auto;
    margin-right: auto;
    max-width: min(calc(100% - 32px), 1232px);
  }
`;

export const StyledTitle = styled(Title)`
  padding: 24px 0 16px;

  ${bpDownSm} {
    padding: 12px 16px;
  }
`;
