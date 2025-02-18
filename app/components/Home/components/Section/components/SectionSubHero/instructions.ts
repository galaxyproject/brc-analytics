import { ROUTES } from "../../../../../../../routes/constants";
import {
  COLOR,
  VARIANT,
} from "@databiosphere/findable-ui/lib/styles/common/mui/button";
import { SIZE } from "@databiosphere/findable-ui/lib/styles/common/constants/size";
import { ButtonProps } from "@mui/material";

export const ACCORDION: Record<string, { details?: string; title: string }> = {
  "0": {
    title: "Select an Organism",
  },
  "1": { title: "Choose a Genome Assembly" },
  "2": {
    title: "Select an Analysis Workflow",
  },
  "3": {
    title: "Continue in Galaxy",
  },
};

const BUTTON_PROPS: Partial<ButtonProps> = {
  color: COLOR.SECONDARY,
  size: SIZE.LARGE,
  variant: VARIANT.CONTAINED,
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
