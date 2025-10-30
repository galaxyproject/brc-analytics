import { AccordionProps } from "@mui/material";
import { Track } from "../../hooks/UseTable/types";

export const ACCORDION_PROPS: Omit<AccordionProps, "children"> = {
  slotProps: { transition: { unmountOnExit: true } },
};

export const GROUP_ID_LABEL: Record<Track["groupId"], string> = {
  genes: "Genes and Gene Predictions",
  map: "Mapping and Sequencing",
  regulation: "Regulation",
  rna: "RNA and Transcriptome",
  varRep: "Variation",
};
