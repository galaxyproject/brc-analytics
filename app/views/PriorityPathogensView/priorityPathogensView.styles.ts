import styled from "@emotion/styled";
import { StyledGridEntityView } from "@databiosphere/findable-ui/lib/components/Index/index.styles";
import {
  mediaTabletDown,
  mediaTabletUp,
} from "@databiosphere/findable-ui/lib/styles/common/mixins/breakpoints";
import { Title } from "@databiosphere/findable-ui/lib/components/Index/components/EntityView/components/layout/Title/title";

export const StyledGrid = styled(StyledGridEntityView)`
  grid-template-columns: 1fr;
  height: auto;
  max-height: none;
  overflow: visible;

  ${mediaTabletUp} {
    margin-left: auto;
    margin-right: auto;
    max-width: min(calc(100% - 32px), 1232px);
    padding-bottom: 24px;
  }
`;

export const StyledTitle = styled(Title)`
  padding: 24px 0 16px;

  ${mediaTabletDown} {
    padding: 12px 16px;
  }
`;
