import type { StaticImageProps } from "@databiosphere/findable-ui/lib/components/common/StaticImage/staticImage";
import type { ReactNode } from "react";

export interface Props extends StaticImageProps {
  /** Caption content, rendered in the figure's figcaption. */
  caption?: ReactNode;
}
