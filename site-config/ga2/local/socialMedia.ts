import { SocialMedia } from "@databiosphere/findable-ui/lib/components/Layout/components/Header/common/entities";
import * as C from "../../../app/components";
import {
  REL_ATTRIBUTE,
  ANCHOR_TARGET,
} from "@databiosphere/findable-ui/lib/components/Links/common/entities";
import { MenuItem } from "@databiosphere/findable-ui/lib/components/Layout/components/Header/components/Content/components/Navigation/components/NavigationMenuItems/navigationMenuItems";

export const SOCIALS = {
  GITHUB: {
    label: "GitHub",
    rel: REL_ATTRIBUTE.NO_OPENER_NO_REFERRER,
    target: ANCHOR_TARGET.BLANK,
    url: "https://github.com/galaxyproject/brc-analytics",
  },
};

export const socialMenuItems: MenuItem[] = [
  {
    ...SOCIALS.GITHUB,
    icon: C.GitHubIcon({ fontSize: "small" }),
  },
];

export const socialMedia: SocialMedia = {
  socials: [
    {
      ...SOCIALS.GITHUB,
      Icon: C.GitHubIcon,
    },
  ],
};
