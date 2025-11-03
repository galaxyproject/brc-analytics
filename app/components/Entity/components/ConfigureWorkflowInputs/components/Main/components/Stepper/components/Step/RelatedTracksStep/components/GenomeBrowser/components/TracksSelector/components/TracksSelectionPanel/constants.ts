import { Track } from "../../hooks/UseTable/types";

export const GROUP_ID_LABEL: Record<Track["groupId"], string> = {
  genes: "Genes and Gene Predictions",
  map: "Mapping and Sequencing",
  regulation: "Expression and Regulation",
  rna: "RNA and Transcriptome",
  varRep: "Variation and Repeats",
};
