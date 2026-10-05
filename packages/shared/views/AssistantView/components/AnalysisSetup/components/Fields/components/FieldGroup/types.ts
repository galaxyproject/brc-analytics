import type {
  AnalysisSetupProps,
  SchemaFieldKey,
} from "@repo/shared/views/AssistantView/components/AnalysisSetup/types";

/**
 * A titled group of analysis schema fields, rendered as one section of the
 * setup panel.
 */
export interface FieldGroup {
  fields: SchemaFieldKey[];
  label: string;
}

export interface FieldGroupProps extends Pick<
  AnalysisSetupProps,
  "loading" | "onSend" | "schema"
> {
  group: FieldGroup;
}
