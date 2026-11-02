import { type StaticImageProps } from "@databiosphere/findable-ui/lib/components/common/StaticImage/staticImage";

export interface OffSiteLinkProps {
  imageProps?: StaticImageProps;
  text: string;
  url: string | null;
}
