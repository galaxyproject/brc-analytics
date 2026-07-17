import { StaticImage } from "@databiosphere/findable-ui/lib/components/common/StaticImage/staticImage";
import { JSX } from "react";
import { StyledContainer } from "./cardMedia.styles";
import { Props } from "./types";

export const CardMedia = ({ className, media }: Props): JSX.Element => {
  return (
    <StyledContainer className={className}>
      <StaticImage
        alt={media.alt}
        height={media.height}
        src={media.src}
        width={media.width}
      />
    </StyledContainer>
  );
};
