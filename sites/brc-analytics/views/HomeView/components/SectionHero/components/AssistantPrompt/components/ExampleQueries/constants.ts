import {
  POPOVER_ORIGIN_HORIZONTAL,
  POPOVER_ORIGIN_VERTICAL,
} from "@databiosphere/findable-ui/lib/styles/common/mui/popover";
import type { MenuProps } from "@mui/material";
import type { ExampleCategory } from "./types";

export const EXAMPLE_CATEGORIES: ExampleCategory[] = [
  {
    label: "Assemblies",
    queries: [
      "What assemblies do you have for Plasmodium vivax?",
      "Which Aedes aegypti assemblies have gene annotation?",
      "What is the reference assembly for Mycobacterium tuberculosis?",
    ],
  },
  {
    label: "Workflows",
    queries: [
      "What workflows do you have for differential expression on yeast?",
      "Which workflows can call variants in Plasmodium falciparum?",
      "Which workflows can I run on Anopheles gambiae RNA-seq data?",
    ],
  },
  {
    label: "Sequencing data",
    queries: [
      "What public sequencing data do you have for Aedes aegypti?",
      "Which countries have the most Plasmodium vivax samples?",
      "Find RNA-seq runs for Trypanosoma cruzi",
    ],
  },
];

export const MENU_PROPS: Partial<MenuProps> = {
  anchorOrigin: {
    horizontal: POPOVER_ORIGIN_HORIZONTAL.CENTER,
    vertical: POPOVER_ORIGIN_VERTICAL.BOTTOM,
  },
  transformOrigin: {
    horizontal: POPOVER_ORIGIN_HORIZONTAL.CENTER,
    vertical: POPOVER_ORIGIN_VERTICAL.TOP,
  },
};
