import { type StaticImage } from "@databiosphere/findable-ui/lib/components/common/StaticImage/staticImage";
import { type ComponentProps, type ElementType } from "react";

export interface Props {
  EndIcon?: ElementType;
  image?: ComponentProps<typeof StaticImage>;
  StartIcon?: ElementType;
}
