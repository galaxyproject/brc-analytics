import { SocialMedia } from "@databiosphere/findable-ui/lib/components/Layout/components/Header/common/entities";
import * as C from "../../../app/components";
import { ROUTES } from "../../../routes/constants";
import {
  REL_ATTRIBUTE,
  ANCHOR_TARGET,
} from "@databiosphere/findable-ui/lib/components/Links/common/entities";
import { MenuItem } from "@databiosphere/findable-ui/lib/components/Layout/components/Header/components/Content/components/Navigation/components/NavigationMenuItems/navigationMenuItems";

export const SOCIALS = {
  CALENDAR: {
    label: "Calendar",
    url: ROUTES.CALENDAR,
  },
  DISCOURSE: {
    label: "Discourse",
    rel: REL_ATTRIBUTE.NO_OPENER_NO_REFERRER,
    target: ANCHOR_TARGET.BLANK,
    url: "https://help.brc-analytics.org/",
  },
  GITHUB: {
    label: "GitHub",
    rel: REL_ATTRIBUTE.NO_OPENER_NO_REFERRER,
    target: ANCHOR_TARGET.BLANK,
    url: "https://github.com/galaxyproject/brc-analytics",
  },
};

export const socialMenuItems: MenuItem[] = [
  {
    ...SOCIALS.CALENDAR,
    icon: C.CalendarIcon({ fontSize: "small" }),
  },
  {
    ...SOCIALS.DISCOURSE,
    icon: C.DiscourseIcon({ fontSize: "small" }),
  },
  {
    ...SOCIALS.GITHUB,
    icon: C.GitHubIcon({ fontSize: "small" }),
  },
];

export const socialMedia: SocialMedia = {
  socials: [
    {
      ...SOCIALS.CALENDAR,
      Icon: C.CalendarIcon,
    },
    {
      ...SOCIALS.DISCOURSE,
      Icon: C.DiscourseIcon,
    },
    {
      ...SOCIALS.GITHUB,
      Icon: C.GitHubIcon,
    },
  ],
};
