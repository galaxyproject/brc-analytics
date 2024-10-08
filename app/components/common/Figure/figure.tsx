import {
  StaticImage,
  StaticImageProps,
} from "@databiosphere/findable-ui/lib/components/common/StaticImage/staticImage";
import { ReactNode } from "react";
import { Figure as FigureWithCaption } from "./figure.styles";

export interface ImageProps extends StaticImageProps {
  caption?: ReactNode;
}

export const Figure = ({
  caption,
  ...props /* Spread props to allow for StaticImage specific props StaticImageProps e.g. "height". */
}: ImageProps): JSX.Element => {
  return (
    <FigureWithCaption>
      <StaticImage {...props} />
      {caption}
    </FigureWithCaption>
  );
};
