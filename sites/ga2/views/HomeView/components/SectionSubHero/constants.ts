import { BUTTON_PRESETS } from "@databiosphere/findable-ui/lib/contracts/mui/Button/presets";
import { type ButtonProps } from "@mui/material";
import { ROUTES } from "@repo/shared/routes/constants";
import { type Props as SectionSubHeroProps } from "@repo/shared/views/HomeView/components/Section/components/SectionSubHero/types";

export const STEPS: SectionSubHeroProps["steps"] = [
  {
    details: "Select an organism.",
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
    details: "Select the dataset(s) to be processed by the selected workflow.",
    title: "Select Workflow Data",
  },
  {
    details: "Run your analysis workflow in Galaxy on TACC with free compute.",
    title: "Continue in Galaxy",
  },
];

export const CTAS: ButtonProps[] = [
  {
    ...BUTTON_PRESETS.SECONDARY_LARGE_OUTLINED,
    children: "Discover Organisms",
    href: ROUTES.ORGANISMS,
  },
  {
    ...BUTTON_PRESETS.SECONDARY_LARGE_OUTLINED,
    children: "Discover Assemblies",
    href: ROUTES.GENOMES,
  },
];

export const IMAGES: string[] = [
  "/main/select-an-organism-ga2.png",
  "/main/chose-genome-assembly-ga2.png",
  "/main/select-analysis-workflow-ga2.png",
  "/main/select-analysis-workflow-data-ga2.png",
  "/main/continue-in-galaxy-ga2.png",
];
