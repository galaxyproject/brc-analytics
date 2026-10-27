import type { LightboxFigureProps } from "@databiosphere/findable-ui/lib/components/common/FigureLightbox/components/LightboxFigure/types";
import { type JSX } from "react";
import { StyledLightboxFigure } from "./lightboxFigure.styles";

/**
 * MDX figure that opens in findable-ui's figure lightbox when clicked, styled like the MDX Figure.
 * @param props - Lightbox figure props; the caption is content, not a figcaption.
 * @returns The figure.
 */
export const LightboxFigure = (props: LightboxFigureProps): JSX.Element => {
  return <StyledLightboxFigure {...props} />;
};
