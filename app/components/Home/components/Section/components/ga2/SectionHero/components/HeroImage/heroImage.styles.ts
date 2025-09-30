import {
  bpUpLg,
  bpUpSm,
} from "@databiosphere/findable-ui/lib/styles/common/mixins/breakpoints";
import styled from "@emotion/styled";
import { Container } from "@mui/material";

export const StyledContainer = styled(Container)`
  grid-column: 1 / -1;
  height: 100%;
  max-height: 346px;

  img {
    height: 376px;
    width: auto;
  }

  ${bpUpSm} {
    grid-column: 6 / -1;
    grid-row: 1;
    max-height: 560px;
    padding-top: 56px;

    img {
      height: 558px;
    }
  }

  ${bpUpLg} {
    padding-top: 22px;

    img {
      height: 624px;
    }
  }
`;
