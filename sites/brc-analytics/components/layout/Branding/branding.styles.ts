import styled from "@emotion/styled";
import { Stack, Typography } from "@mui/material";
import { bpDown1200 } from "@repo/shared/styles/mixins/breakpoints";

export const StyledStack = styled(Stack)`
  align-items: center;
  flex-direction: row;

  img {
    margin: 0;
  }

  ${bpDown1200} {
    display: contents;
  }
`;

export const LargeBrand = styled.div`
  padding: 8px;

  ${bpDown1200} {
    padding-left: 0;
    padding-right: 0;
  }
`;

export const SmallBrand = styled.div`
  padding: 4px;

  ${bpDown1200} {
    padding-left: 0;
    padding-right: 0;
  }
`;

export const FooterText = styled(Typography)`
  max-width: 400px;
`;
