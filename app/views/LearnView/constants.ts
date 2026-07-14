import { SectionContentCard } from "@/components/common/Card/components/SectionContentCard/sectionContentCard";
import { GalaxyIcon } from "@/components/common/CustomIcon/components/GalaxyIcon/galaxyIcon";
import { RocketLaunchIcon } from "@/components/common/CustomIcon/components/RocketLaunchIcon/rocketLaunchIcon";
import { SearchIcon } from "@databiosphere/findable-ui/lib/components/common/CustomIcon/components/SearchIcon/searchIcon";
import { ComponentProps } from "react";
import { BookmarkStarIcon } from "./components/icon/BookmarkStarIcon/bookmarkStarIcon";
import { LiveHelpIcon } from "./components/icon/LiveHelpIcon/liveHelpIcon";
import { SmartToyIcon } from "./components/icon/SmartToyIcon/smartToyIcon";
import { YouTubeIcon } from "./components/icon/YouTubeIcon/youTubeIcon";

export const CARDS: ComponentProps<typeof SectionContentCard>[] = [
  {
    StartIcon: RocketLaunchIcon,
    cardUrl: "/learn/getting-started",
    secondaryText:
      "Set up your account and run your first genomic analysis with BRC Analytics.",
    title: "Getting Started",
  },
  {
    StartIcon: SmartToyIcon,
    cardUrl: "/learn/assistant",
    secondaryText:
      "Set up an analysis by chatting in plain language, then hand off to Galaxy to run it.",
    title: "About the Assistant",
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
    cardUrl: "/learn/faq",
    secondaryText:
      "Find answers to common questions about using BRC Analytics.",
    title: "FAQ",
  },
  {
    StartIcon: YouTubeIcon,
    cardUrl: "/learn/youtube-channels",
    secondaryText:
      "Watch video tutorials, walkthroughs, and presentations on BRC Analytics and Galaxy.",
    title: "YouTube Channels",
  },
  {
    StartIcon: SearchIcon,
    cardUrl: "/learn/sequence-search-workflows",
    secondaryText:
      "Search SRA by genetic content using kmindex and LexicMap workflows.",
    title: "Sequence Search Workflows",
  },
  {
    StartIcon: SmartToyIcon,
    cardUrl: "/learn/mcp",
    secondaryText:
      "Connect AI assistants like Claude to the BRC catalog and ENA search via the Model Context Protocol.",
    title: "MCP Server",
  },
];
