import { StyledContainer } from "./heroImage.styles";
import { IMAGE_PROPS } from "./constants";
import Image from "next/image";

export const HeroImage = (): JSX.Element => {
  return (
    <StyledContainer disableGutters>
      <Image {...IMAGE_PROPS} alt="GenomeArk" />
    </StyledContainer>
  );
};
