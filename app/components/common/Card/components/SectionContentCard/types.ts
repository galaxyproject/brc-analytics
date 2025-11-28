import { ComponentProps, ElementType } from "react";
import { StaticImage } from "@databiosphere/findable-ui/lib/components/common/StaticImage/staticImage";

export interface Props {
  EndIcon?: ElementType;
  image?: ComponentProps<typeof StaticImage>;
  StartIcon?: ElementType;
}
