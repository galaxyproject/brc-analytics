import type {
  AnalysisSchema,
  ClearableField,
} from "@repo/shared/services/api-client/types";

export interface AnalysisSetupProps {
  handoffUrl: string | null;
  loading: boolean;
  onClearField: (field: ClearableField) => Promise<void>;
  schema: AnalysisSchema | null;
}

/**
 * Key of a field in the analysis schema.
 */
export type SchemaFieldKey = keyof AnalysisSchema;
