import { Box, Button, Chip, Divider, Typography } from "@mui/material";
import Router from "next/router";
import { JSX, useCallback } from "react";
import { normalizePagePath } from "../../../hooks/UseCurrentPath/utils";
import { ENTITY_KEYS } from "../../../providers/workflowHandoff/constants";
import { useHandoffDispatch } from "../../../providers/workflowHandoff/hooks/UseHandoffDispatch/hook";
import {
  AnalysisSchema,
  FieldStatus,
  SchemaFieldState,
} from "../../../types/api";
import {
  FieldRow,
  FieldValue,
  PanelContainer,
  PanelHeader,
} from "./schemaPanel.styles";
import { extractAccessions, resolveSequencingSource } from "./utils";

interface SchemaPanelProps {
  handoffUrl: string | null;
  schema: AnalysisSchema | null;
}

const FIELD_LABELS: Record<keyof AnalysisSchema, string> = {
  analysis_type: "Analysis Type",
  assembly: "Assembly",
  data_characteristics: "Data Characteristics",
  data_source: "Data Source",
  gene_annotation: "Gene Annotation",
  organism: "Organism",
  workflow: "Workflow",
};

const REQUIRED_FIELDS: (keyof AnalysisSchema)[] = [
  "organism",
  "assembly",
  "analysis_type",
  "workflow",
  "data_source",
  "data_characteristics",
];

const OPTIONAL_FIELDS: (keyof AnalysisSchema)[] = ["gene_annotation"];

const FIELD_ORDER: (keyof AnalysisSchema)[] = [
  ...REQUIRED_FIELDS,
  ...OPTIONAL_FIELDS,
];

// Frozen so the shared reference across PLACEHOLDER_SCHEMA fields can't
// be mutated through any one key.
const EMPTY_FIELD: SchemaFieldState = Object.freeze({
  detail: null,
  status: "empty",
  value: null,
});

const PLACEHOLDER_SCHEMA: AnalysisSchema = {
  analysis_type: EMPTY_FIELD,
  assembly: EMPTY_FIELD,
  data_characteristics: EMPTY_FIELD,
  data_source: EMPTY_FIELD,
  gene_annotation: EMPTY_FIELD,
  organism: EMPTY_FIELD,
  workflow: EMPTY_FIELD,
};

/**
 * Get the status indicator for a schema field.
 * @param props - Component props
 * @param props.optional - Whether the field is optional (not required to hand off)
 * @param props.status - Field status
 * @returns Status chip element
 */
function StatusIndicator({
  optional,
  status,
}: {
  optional: boolean;
  status: FieldStatus;
}): JSX.Element {
  if (status === "filled") {
    return <Chip color="success" label="Done" size="small" />;
  }
  if (status === "needs_attention") {
    return <Chip color="warning" label="Attention" size="small" />;
  }
  return (
    <Chip
      label={optional ? "Optional" : "Pending"}
      size="small"
      variant="outlined"
    />
  );
}

/**
 * Displays the analysis schema as a live progress panel.
 * @param props - Component props
 * @param props.handoffUrl - URL for workflow handoff
 * @param props.schema - Current analysis schema state
 * @returns Schema panel element
 */
export const SchemaPanel = ({
  handoffUrl,
  schema,
}: SchemaPanelProps): JSX.Element => {
  const { onSetHandoff } = useHandoffDispatch();

  const handleContinue = useCallback((): void => {
    if (!handoffUrl || !schema) return;
    onSetHandoff({
      entity: ENTITY_KEYS.ASSEMBLIES,
      inputs: {
        accessions: extractAccessions(schema.data_source),
        sequencingSource: resolveSequencingSource(schema.data_source.value),
      },
      // Normalise so the dispatch key matches the read site (useCurrentPath)
      // regardless of trailing slash / query / fragment from the backend.
      path: normalizePagePath(handoffUrl),
    });
    // Singleton Router.push (not useRouter) — SPA nav, no reactive value to
    // track in deps. A full-page nav (window.location.href) would tear down
    // the WorkflowInputsView provider before the consumer reads dispatched
    // state.
    Router.push(handoffUrl);
  }, [handoffUrl, onSetHandoff, schema]);

  const isEmpty = !schema;
  const activeSchema = schema ?? PLACEHOLDER_SCHEMA;

  const filledCount = FIELD_ORDER.filter(
    (key) => activeSchema[key].status === "filled"
  ).length;

  return (
    <PanelContainer>
      <PanelHeader>
        <Typography variant="subtitle1">Analysis Setup</Typography>
        <Typography color="text.secondary" variant="caption">
          {filledCount} / {FIELD_ORDER.length} configured
        </Typography>
      </PanelHeader>

      {isEmpty && (
        <Box sx={{ pb: 1, pt: 2, px: 2 }}>
          <Typography color="text.secondary" variant="body2">
            Tell the assistant what you&apos;re working on (an organism, a
            paper, a kind of analysis) and it&apos;ll help fill these in:
          </Typography>
        </Box>
      )}

      <Divider />

      <Box sx={{ p: 0 }}>
        {FIELD_ORDER.map((key) => {
          const field: SchemaFieldState = activeSchema[key];
          return (
            <FieldRow key={key}>
              <Box
                sx={{
                  alignItems: "center",
                  display: "flex",
                  justifyContent: "space-between",
                }}
              >
                <Typography variant="body2">{FIELD_LABELS[key]}</Typography>
                <StatusIndicator
                  optional={OPTIONAL_FIELDS.includes(key)}
                  status={field.status}
                />
              </Box>
              {field.value && (
                <FieldValue variant="body2">{field.value}</FieldValue>
              )}
            </FieldRow>
          );
        })}
      </Box>

      {handoffUrl && (
        <Box sx={{ p: 2 }}>
          <Button
            fullWidth
            onClick={handleContinue}
            size="large"
            variant="contained"
          >
            Continue to Workflow Setup
          </Button>
        </Box>
      )}
    </PanelContainer>
  );
};
