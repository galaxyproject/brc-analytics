import Image from "next/image";
import { Fragment, JSX } from "react";
import {
  IMAGE_PROPS,
  IMAGE_PROPS_SMALL,
  IMAGE_PROPS_XSMALL,
} from "./constants";
import {
  StyledContainer,
  StyledImage,
  StyledImageXSmall,
} from "./heroImage.styles";

export const HeroImage = (): JSX.Element => {
  return (
    <Fragment>
      <StyledImageXSmall {...IMAGE_PROPS_XSMALL} alt="GenomeArk" />
      <StyledImage {...IMAGE_PROPS_SMALL} alt="GenomeArk" />
      <StyledContainer disableGutters>
        <Image {...IMAGE_PROPS} alt="GenomeArk" />
      </StyledContainer>
    </Fragment>
  );
};
