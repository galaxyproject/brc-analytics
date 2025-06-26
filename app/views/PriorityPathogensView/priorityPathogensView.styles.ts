import styled from "@emotion/styled";
import { Index } from "@databiosphere/findable-ui/lib/components/Index/index.styles";
import { mediaTabletUp } from "@databiosphere/findable-ui/lib/styles/common/mixins/breakpoints";

export const StyledIndex = styled(Index)`
  grid-template-columns: 1fr;

  ${mediaTabletUp} {
    margin-left: auto;
    margin-right: auto;
    max-width: min(calc(100% - 32px), 1232px);
  }
`;
