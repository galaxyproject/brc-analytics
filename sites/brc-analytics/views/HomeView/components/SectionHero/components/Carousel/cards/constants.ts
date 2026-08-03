import * as MDX from "@brc/views/HomeView/components/SectionHero/components/Carousel/content";
import { type CardProps } from "@databiosphere/findable-ui/lib/components/common/Card/card";

export const CAROUSEL_CARDS: Pick<CardProps, "text">[] = [
  {
    text: MDX.AICodeathon2({}),
  },
  {
    text: MDX.UserSurvey({}),
  },
  {
    text: MDX.EvolutionaryDynamicsOfCodingOverlapsInMeaslesVirus({}),
  },
  {
    text: MDX.Roadmap({}),
  },
  {
    text: MDX.WebinarSeries({}),
  },
];
