import { DiscourseIcon } from "@databiosphere/findable-ui/lib/components/common/CustomIcon/components/DiscourseIcon/discourseIcon";
import { GitHubIcon } from "@databiosphere/findable-ui/lib/components/common/CustomIcon/components/GitHubIcon/gitHubIcon";
import { type SocialMedia } from "@databiosphere/findable-ui/lib/components/Layout/components/Header/common/entities";
import { type MenuItem } from "@databiosphere/findable-ui/lib/components/Layout/components/Header/components/Content/components/Navigation/components/NavigationMenuItems/navigationMenuItems";
import {
  ANCHOR_TARGET,
  REL_ATTRIBUTE,
} from "@databiosphere/findable-ui/lib/components/Links/common/entities";
import { CalendarIcon } from "@repo/shared/components/CustomIcon/components/CalendarIcon/calendarIcon";
import { ROUTES } from "@routes/constants";

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
    icon: CalendarIcon({ fontSize: "small" }),
  },
  {
    ...SOCIALS.DISCOURSE,
    icon: DiscourseIcon({ fontSize: "small" }),
  },
  {
    ...SOCIALS.GITHUB,
    icon: GitHubIcon({ fontSize: "small" }),
  },
];

export const socialMedia: SocialMedia = {
  socials: [
    {
      ...SOCIALS.CALENDAR,
      Icon: CalendarIcon,
    },
    {
      ...SOCIALS.DISCOURSE,
      Icon: DiscourseIcon,
    },
    {
      ...SOCIALS.GITHUB,
      Icon: GitHubIcon,
    },
  ],
};
