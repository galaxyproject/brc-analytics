import { StaticImageProps } from "@databiosphere/findable-ui/lib/components/common/StaticImage/staticImage";

interface Portals {
  imageProps: StaticImageProps;
  label: string;
  url: string;
}

export interface Props {
  portals: Portals[];
  title: string;
}
