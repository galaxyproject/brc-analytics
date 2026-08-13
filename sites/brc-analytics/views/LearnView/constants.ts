import { SearchIcon } from "@databiosphere/findable-ui/lib/components/common/CustomIcon/components/SearchIcon/searchIcon";
import { ArticleIcon } from "@repo/shared/components/CustomIcon/components/ArticleIcon/articleIcon";
import { BookmarkStarIcon } from "@repo/shared/components/CustomIcon/components/BookmarkStarIcon/bookmarkStarIcon";
import { GalaxyIcon } from "@repo/shared/components/CustomIcon/components/GalaxyIcon/galaxyIcon";
import { LiveHelpIcon } from "@repo/shared/components/CustomIcon/components/LiveHelpIcon/liveHelpIcon";
import { RocketLaunchIcon } from "@repo/shared/components/CustomIcon/components/RocketLaunchIcon/rocketLaunchIcon";
import { SmartToyIcon } from "@repo/shared/components/CustomIcon/components/SmartToyIcon/smartToyIcon";
import { YouTubeIcon } from "@repo/shared/components/CustomIcon/components/YouTubeIcon/youTubeIcon";
import { type SectionContentCard } from "@repo/shared/views/docs/components/SectionContentCard/sectionContentCard";
import type { ComponentProps } from "react";

export const CARDS: ComponentProps<typeof SectionContentCard>[] = [
  {
    StartIcon: RocketLaunchIcon,
    href: "/learn/getting-started",
    secondaryText:
      "Set up your account and run your first genomic analysis with BRC Analytics.",
    title: "Getting Started",
  },
  {
    StartIcon: SmartToyIcon,
    href: "/learn/assistant",
    secondaryText:
      "Set up an analysis by chatting in plain language, then hand off to Galaxy to run it.",
    title: "About the Assistant",
  },
  {
    StartIcon: GalaxyIcon,
    href: "/learn/using-galaxy",
    secondaryText:
      "Learn about Galaxy, the open-source platform powering BRC Analytics computations.",
    title: "Using Galaxy",
  },
  {
    StartIcon: BookmarkStarIcon,
    href: "/learn/featured-analyses",
    secondaryText:
      "Explore real-world research examples demonstrating BRC Analytics workflows.",
    title: "Featured Analyses",
  },
  {
    StartIcon: ArticleIcon,
    href: "/learn/blog",
    secondaryText:
      "Follow ongoing work in progress: methods, datasets and results as they develop.",
    title: "Blog",
  },
  {
    StartIcon: LiveHelpIcon,
    href: "/learn/faq",
    secondaryText:
      "Find answers to common questions about using BRC Analytics.",
    title: "FAQ",
  },
  {
    StartIcon: YouTubeIcon,
    href: "/learn/youtube-channels",
    secondaryText:
      "Watch video tutorials, walkthroughs, and presentations on BRC Analytics and Galaxy.",
    title: "YouTube Channels",
  },
  {
    StartIcon: SearchIcon,
    href: "/learn/sequence-search-workflows",
    secondaryText:
      "Search SRA by genetic content using kmindex and LexicMap workflows.",
    title: "Sequence Search Workflows",
  },
  {
    StartIcon: SmartToyIcon,
    href: "/learn/mcp",
    secondaryText:
      "Connect AI assistants like Claude to the BRC catalog and ENA search via the Model Context Protocol.",
    title: "MCP Server",
  },
];
