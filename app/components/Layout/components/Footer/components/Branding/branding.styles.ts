import { bpDownSm } from "@databiosphere/findable-ui/lib/styles/common/mixins/breakpoints";
import styled from "@emotion/styled";
import { Typography } from "@mui/material";

export const Brands = styled.div`
  align-items: center;
  display: flex;
  gap: 16px;

  img {
    margin: 0;
  }

  ${bpDownSm} {
    div {
      padding-left: 0;
      padding-right: 0;
    }
  }
`;

export const LargeBrand = styled.div`
  padding: 8px;
`;

export const SmallBrand = styled.div`
  padding: 4px;
`;

export const FooterText = styled(Typography)`
  max-width: 400px;
`;
