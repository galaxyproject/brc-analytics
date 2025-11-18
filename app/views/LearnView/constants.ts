import { SectionContentCard } from "../../components/common/Card/components/SectionContentCard/sectionContentCard";
import { ComponentProps } from "react";
import { RocketLaunchIcon } from "./components/icon/RocketLaunchIcon/rocketLaunchIcon";
import { BookmarkStarIcon } from "./components/icon/BookmarkStarIcon/bookmarkStarIcon";
import { LiveHelpIcon } from "./components/icon/LiveHelpIcon/liveHelpIcon";
import { GalaxyIcon } from "./components/icon/GalaxyIcon/galaxyIcon";

export const CARDS: ComponentProps<typeof SectionContentCard>[] = [
  {
    StartIcon: RocketLaunchIcon,
    cardUrl: "/learn",
    secondaryText: "Learn how to get started with BRC",
    title: "Get Started",
  },
  {
    StartIcon: GalaxyIcon,
    cardUrl: "/learn",
    secondaryText: "The following is a guided walk-through of using Galaxy",
    title: "Using Galaxy",
  },
  {
    StartIcon: BookmarkStarIcon,
    cardUrl: "/learn/featured-analyses",
    secondaryText: "Discover and access BRC datasets",
    title: "Featured Analyses",
  },
  {
    StartIcon: LiveHelpIcon,
    cardUrl: "/learn",
    secondaryText:
      "The following is a guided walk-through of the BRC documentation",
    title: "FAQs",
  },
];
