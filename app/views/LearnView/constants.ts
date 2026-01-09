import { SectionContentCard } from "../../components/common/Card/components/SectionContentCard/sectionContentCard";
import { ComponentProps } from "react";
import { RocketLaunchIcon } from "./components/icon/RocketLaunchIcon/rocketLaunchIcon";
import { BookmarkStarIcon } from "./components/icon/BookmarkStarIcon/bookmarkStarIcon";
import { GalaxyIcon } from "./components/icon/GalaxyIcon/galaxyIcon";
import { LiveHelpIcon } from "./components/icon/LiveHelpIcon/liveHelpIcon";

export const CARDS: ComponentProps<typeof SectionContentCard>[] = [
  {
    StartIcon: RocketLaunchIcon,
    cardUrl: "/learn/getting-started",
    secondaryText:
      "Set up your account and run your first genomic analysis with BRC Analytics.",
    title: "Get Started",
  },
  {
    StartIcon: GalaxyIcon,
    cardUrl: "/learn/using-galaxy",
    secondaryText:
      "Learn about Galaxy, the open-source platform powering BRC Analytics computations.",
    title: "Using Galaxy",
  },
  {
    StartIcon: BookmarkStarIcon,
    cardUrl: "/learn/featured-analyses",
    secondaryText:
      "Explore real-world research examples demonstrating BRC Analytics workflows.",
    title: "Featured Analyses",
  },
  {
    StartIcon: LiveHelpIcon,
    cardUrl: "/learn/faqs",
    secondaryText:
      "Find answers to common questions about using BRC Analytics.",
    title: "FAQs",
  },
];
