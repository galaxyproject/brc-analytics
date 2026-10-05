import { Footer } from "@databiosphere/findable-ui/lib/components/Layout/components/Footer/footer";
import { PALETTE } from "@databiosphere/findable-ui/lib/styles/common/constants/palette";
import styled from "@emotion/styled";
import { bpDown1200 } from "@repo/shared/styles/mixins/breakpoints";

export const StyledFooter = styled(Footer)`
  background-color: ${PALETTE.SMOKE_LIGHTEST};

  ${bpDown1200} {
    padding: 16px 0;

    .MuiToolbar-root {
      align-items: flex-start;
      gap: 24px;
      flex-direction: column;
    }
  }
`;
