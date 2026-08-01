import { type StaticImage } from "@databiosphere/findable-ui/lib/components/common/StaticImage/staticImage";
import type { ComponentProps, ElementType } from "react";

export interface Props {
  EndIcon?: ElementType;
  href?: string;
  image?: ComponentProps<typeof StaticImage>;
  StartIcon?: ElementType;
}
