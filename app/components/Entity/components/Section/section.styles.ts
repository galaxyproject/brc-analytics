import { mediaTabletDown } from "@databiosphere/findable-ui/lib/styles/common/mixins/breakpoints";
import styled from "@emotion/styled";
import { Typography } from "@mui/material";

export const StyledTypography = styled(Typography)`
  padding: 20px;

  ${mediaTabletDown} {
    padding: 20px 16px;
  }
` as typeof Typography;

export const Content = styled("div")`
  padding: 20px;

  ${mediaTabletDown} {
    padding: 20px 16px;
  }
`;
