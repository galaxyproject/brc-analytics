import {
  bpUpLg,
  bpUpSm,
} from "@databiosphere/findable-ui/lib/styles/common/mixins/breakpoints";
import styled from "@emotion/styled";
import { Container } from "@mui/material";
import Image from "next/image";

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

export const StyledImage = styled(Image)`
  display: none;
  height: 98px !important;
  top: unset !important;
  width: auto !important;

  ${bpUpSm} {
    display: block;
  }
`;

export const StyledImageXSmall = styled(Image)`
  display: none;
  height: 148px !important;
  width: auto !important;

  ${bpUpSm} {
    display: block;
  }

  ${bpUpLg} {
    top: 52px !important;
  }
`;
