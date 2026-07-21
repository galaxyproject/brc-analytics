import { SectionContentCard } from "@/components/common/Card/components/SectionContentCard/sectionContentCard";
import { GalaxyIcon } from "@repo/shared/components/CustomIcon/components/GalaxyIcon/galaxyIcon";
import { RocketLaunchIcon } from "@repo/shared/components/CustomIcon/components/RocketLaunchIcon/rocketLaunchIcon";
import { SparkleIcon } from "@repo/shared/components/CustomIcon/components/SparkleIcon/sparkleIcon";
import { ComponentProps } from "react";

export const BRC_CARDS: ComponentProps<typeof SectionContentCard>[] = [
  {
    StartIcon: SparkleIcon,
    cardUrl: "/about/vision",
    secondaryText:
      "What we're building, who we're building it for, and our commitments to the research community.",
    title: "Vision",
  },
  {
    StartIcon: GalaxyIcon,
    cardUrl: "/about/partner-resources",
    secondaryText:
      "The four partner projects behind BRC Analytics: Galaxy, UCSC Genome Browser, HyPhy, and TACC.",
    title: "Partner Resources",
  },
  {
    StartIcon: RocketLaunchIcon,
    cardUrl: "/about/roadmap",
    secondaryText:
      "Our current priorities, upcoming features, and longer-term direction for the platform.",
    title: "Roadmap",
  },
];

export const GA2_CARDS: ComponentProps<typeof SectionContentCard>[] = [
  {
    StartIcon: GalaxyIcon,
    cardUrl: "/about/partner-resources",
    secondaryText:
      "The partner projects behind Genome Ark 2: Galaxy, UCSC Genome Browser, TACC, and Jetstream2.",
    title: "Partner Resources",
  },
  {
    StartIcon: RocketLaunchIcon,
    cardUrl: "/about/roadmap",
    secondaryText:
      "Our current priorities, upcoming features, and longer-term direction for the platform.",
    title: "Roadmap",
  },
];
