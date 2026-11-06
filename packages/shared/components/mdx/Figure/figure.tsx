import { StaticImage } from "@databiosphere/findable-ui/lib/components/common/StaticImage/staticImage";
import { type JSX } from "react";
import { Figure as FigureWithCaption } from "./figure.styles";
import type { Props } from "./types";

/**
 * MDX figure: the image, with its caption in the figure's figcaption.
 * @param props - Figure props.
 * @param props.caption - Caption content, rendered in the figure's figcaption.
 * @returns The figure.
 */
export const Figure = ({
  caption,
  ...props /* Spread props to allow for StaticImage specific props StaticImageProps e.g. "height". */
}: Props): JSX.Element => {
  return (
    <FigureWithCaption>
      <StaticImage {...props} />
      {caption && <figcaption>{caption}</figcaption>}
    </FigureWithCaption>
  );
};
