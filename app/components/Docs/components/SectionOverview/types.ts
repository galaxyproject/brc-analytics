import { LinkProps } from "@databiosphere/findable-ui/lib/components/Links/components/Link/link";

export interface Overview {
  label: string;
  links: LinkProps[];
}

export interface Props {
  overview?: Overview[];
}
