import { SectionContentCard } from "../../components/common/Card/components/SectionContentCard/sectionContentCard";
import { ComponentProps } from "react";
import { RocketLaunchIcon } from "./components/icon/RocketLaunchIcon/rocketLaunchIcon";
import { BookmarkStarIcon } from "./components/icon/BookmarkStarIcon/bookmarkStarIcon";
import { LiveHelpIcon } from "./components/icon/LiveHelpIcon/liveHelpIcon";
import { GalaxyIcon } from "./components/icon/GalaxyIcon/galaxyIcon";

export const CARDS: ComponentProps<typeof SectionContentCard>[] = [
  {
    StartIcon: RocketLaunchIcon,
    cardUrl: "/learn/getting-started",
    secondaryText: "",
    title: "Get Started",
  },
  {
    StartIcon: GalaxyIcon,
    cardUrl: "/learn/using-galaxy",
    secondaryText: "",
    title: "Using Galaxy",
  },
  {
    StartIcon: BookmarkStarIcon,
    cardUrl: "/learn/featured-analyses",
    secondaryText: "",
    title: "Featured Analyses",
  },
  {
    StartIcon: LiveHelpIcon,
    cardUrl: "/learn/faqs",
    secondaryText: "",
    title: "FAQs",
  },
];
