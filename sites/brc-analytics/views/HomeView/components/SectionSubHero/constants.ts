import { BUTTON_PROPS } from "@databiosphere/findable-ui/lib/components/common/Button/constants";
import { type ButtonProps } from "@mui/material";
import { ROUTES } from "@repo/shared/routes/constants";
import { type Props as SectionSubHeroProps } from "@repo/shared/views/HomeView/components/Section/components/SectionSubHero/types";

export const STEPS: SectionSubHeroProps["steps"] = [
  {
    details: "Select from pathogen, vector or host organisms.",
    title: "Select an Organism",
  },
  {
    details:
      "Select a reference assembly from NCBI and view on the UCSC Genome Browser.",
    title: "Choose a Genome Assembly",
  },
  {
    details: "Choose from curated Galaxy workflows for your assembly.",
    title: "Select an Analysis Workflow",
  },
  {
    details: "Run your analysis workflow in Galaxy on TACC with free compute.",
    title: "Continue in Galaxy",
  },
];

export const CTAS: ButtonProps[] = [
  {
    ...BUTTON_PROPS.SECONDARY_LARGE_CONTAINED,
    children: "Discover Organisms",
    href: ROUTES.ORGANISMS,
  },
  {
    ...BUTTON_PROPS.SECONDARY_LARGE_CONTAINED,
    children: "Discover Assemblies",
    href: ROUTES.GENOMES,
  },
];

export const IMAGES: string[] = [
  "/main/select-an-organism.png",
  "/main/chose-genome-assembly.png",
  "/main/select-analysis-workflow.png",
  "/main/continue-in-galaxy.png",
];
