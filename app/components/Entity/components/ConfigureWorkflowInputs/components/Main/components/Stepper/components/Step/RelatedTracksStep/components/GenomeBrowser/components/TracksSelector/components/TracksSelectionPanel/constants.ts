import { UcscTrackNode } from "@brc-analytics/core/utils/ucsc-tracks-api/entities";

export const GROUP_ID_LABEL: Record<UcscTrackNode["groupId"], string> = {
  genes: "Genes and Gene Predictions",
  map: "Mapping and Sequencing",
  regulation: "Expression and Regulation",
  rna: "RNA and Transcriptome",
  varRep: "Variation and Repeats",
};
