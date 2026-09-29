import type { SchemaFieldKey } from "@repo/shared/views/AssistantView/components/AnalysisSetup/types";

/**
 * Row label for each analysis schema field.
 */
export const FIELD_LABELS: Record<SchemaFieldKey, string> = {
  analysis_type: "Analysis type",
  assembly: "Assembly",
  data_characteristics: "Data characteristics",
  data_source: "Data source",
  gene_annotation: "Gene annotation",
  organism: "Organism",
  workflow: "Workflow",
};
