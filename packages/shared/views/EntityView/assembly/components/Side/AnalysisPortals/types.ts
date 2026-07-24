import type { StaticImageProps } from "@databiosphere/findable-ui/lib/components/common/StaticImage/staticImage";

interface Portal {
  imageProps: StaticImageProps;
  label: string;
  url: string;
}

export interface Props {
  portals: Portal[];
  title: string;
}
