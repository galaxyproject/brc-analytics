import { GalaxyIcon } from "@repo/shared/components/CustomIcon/components/GalaxyIcon/galaxyIcon";
import { RocketLaunchIcon } from "@repo/shared/components/CustomIcon/components/RocketLaunchIcon/rocketLaunchIcon";
import { SparkleIcon } from "@repo/shared/components/CustomIcon/components/SparkleIcon/sparkleIcon";
import { type SectionContentCard } from "@repo/shared/views/docs/components/SectionContentCard/sectionContentCard";
import { type ComponentProps } from "react";

export const CARDS: ComponentProps<typeof SectionContentCard>[] = [
  {
    StartIcon: SparkleIcon,
    href: "/about/vision",
    secondaryText:
      "What we're building, who we're building it for, and our commitments to the research community.",
    title: "Vision",
  },
  {
    StartIcon: GalaxyIcon,
    href: "/about/partner-resources",
    secondaryText:
      "The four partner projects behind BRC Analytics: Galaxy, UCSC Genome Browser, HyPhy, and TACC.",
    title: "Partner Resources",
  },
  {
    StartIcon: RocketLaunchIcon,
    href: "/about/roadmap",
    secondaryText:
      "Our current priorities, upcoming features, and longer-term direction for the platform.",
    title: "Roadmap",
  },
];
