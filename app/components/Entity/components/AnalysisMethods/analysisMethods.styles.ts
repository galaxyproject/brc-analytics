import styled from "@emotion/styled";
import { Typography } from "@mui/material";
import { mediaTabletDown } from "@databiosphere/findable-ui/lib/styles/common/mixins/breakpoints";

export const StyledTypography = styled(Typography)`
  & {
    font-size: 18px;
    letter-spacing: normal;
    line-height: 26px;

    ${mediaTabletDown} {
      margin: 0 16px;
    }
  }
` as typeof Typography;
