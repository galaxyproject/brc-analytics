import type { StaticImageProps } from "@databiosphere/findable-ui/lib/components/common/StaticImage/staticImage";
import type { ReactNode } from "react";

export interface Props extends StaticImageProps {
  caption?: ReactNode;
}
