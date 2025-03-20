import { CardProps } from "@databiosphere/findable-ui/lib/components/common/Card/card";
import * as MDX from "../content";

export const CAROUSEL_CARDS: Pick<CardProps, "text">[] = [
  // {
  //   text: MDX.Webinars({}),
  // },
  {
    text: MDX.Webinar20250326({}),
  },
  {
    text: MDX.Webinar20241030({}),
  },
  {
    text: MDX.Webinar20241004({}),
  },
  {
    text: MDX.ShareUsageAndJoinAdvisoryPanel({}),
  },
];
