import { SocialMedia } from "@databiosphere/findable-ui/lib/components/Layout/components/Header/common/entities";
import * as C from "../../../app/components";

export const SOCIALS = {
  CALENDAR: {
    label: "Calendar",
    url: "/calendar",
  },
  DISCOURSE: {
    label: "Discourse",
    url: "https://help.brc-analytics.org/",
  },
  GITHUB: {
    label: "GitHub",
    url: "https://github.com/galaxyproject/brc-analytics",
  },
};

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
