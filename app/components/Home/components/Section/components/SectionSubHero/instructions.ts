import { ROUTES } from "../../../../../../../routes/constants";
import { BUTTON_PROPS as MUI_BUTTON_PROPS } from "@databiosphere/findable-ui/lib/styles/common/mui/button";
import { ButtonProps } from "@mui/material";

export const ACCORDION: Record<string, { details?: string; title: string }> = {
  "0": {
    details: "Select from pathogen, vector or host organisms.",
    title: "Select an Organism",
  },
  "1": {
    details:
      "Select a reference assembly from NCBI and view on the UCSC Genome Browser.",
    title: "Choose a Genome Assembly",
  },
  "2": {
    details: "Choose from curated Galaxy workflows for your assembly.",
    title: "Select an Analysis Workflow",
  },
  "3": {
    details: "Run your analysis workflow in Galaxy on TACC with free compute.",
    title: "Continue in Galaxy",
  },
};

const BUTTON_PROPS: Partial<ButtonProps> = {
  color: MUI_BUTTON_PROPS.COLOR.SECONDARY,
  size: MUI_BUTTON_PROPS.SIZE.LARGE,
  variant: MUI_BUTTON_PROPS.VARIANT.CONTAINED,
};

export const BUTTON: Record<string, ButtonProps> = {
  "0": {
    ...BUTTON_PROPS,
    children: "Discover Organisms",
    href: ROUTES.ORGANISMS,
  },
  "1": {
    ...BUTTON_PROPS,
    children: "Discover Assemblies",
    href: ROUTES.GENOMES,
  },
};

export const IMAGE: Record<string, string> = {
  "0": "/main/select-an-organism.png",
  "1": "/main/chose-genome-assembly.png",
  "2": "/main/select-analysis-workflow.png",
  "3": "/main/continue-in-galaxy.png",
};
