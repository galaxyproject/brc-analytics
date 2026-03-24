import { Box, Button, Chip, Divider, Typography } from "@mui/material";
import { JSX, useCallback } from "react";
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

const ASSISTANT_HANDOFF_KEY = "brc-assistant-handoff";

function resolveDataSource(value: string | null | undefined): "ena" | "upload" {
  if (!value) return "ena";
  const lower = value.toLowerCase();
  if (
    lower.includes("upload") ||
    lower.includes("own") ||
    lower.includes("local")
  ) {
    return "upload";
  }
  return "ena";
}

/**
 * Get the status indicator for a schema field.
 * @param props - Component props
 * @param props.status - Field status
 * @returns Status chip element
 */
function StatusIndicator({ status }: { status: FieldStatus }): JSX.Element {
  if (status === "filled") {
    return <Chip color="success" label="Done" size="small" />;
  }
  if (status === "needs_attention") {
    return <Chip color="warning" label="Attention" size="small" />;
  }
  return <Chip label="Pending" size="small" variant="outlined" />;
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
  const handleContinue = useCallback((): void => {
    if (!handoffUrl || !schema) return;
    const handoff = {
      dataSource: resolveDataSource(schema.data_source.value),
      timestamp: Date.now(),
    };
    localStorage.setItem(ASSISTANT_HANDOFF_KEY, JSON.stringify(handoff));
    window.location.href = handoffUrl;
  }, [handoffUrl, schema]);
  if (!schema) {
    return (
      <PanelContainer>
        <PanelHeader>
          <Typography variant="subtitle1">Analysis Setup</Typography>
        </PanelHeader>
        <Box sx={{ p: 2 }}>
          <Typography color="text.secondary" variant="body2">
            Start a conversation to begin configuring your analysis. The
            assistant will help you choose an organism, assembly, and workflow.
          </Typography>
        </Box>
      </PanelContainer>
    );
  }

  const filledCount = REQUIRED_FIELDS.filter(
    (key) => schema[key].status === "filled"
  ).length;

  return (
    <PanelContainer>
      <PanelHeader>
        <Typography variant="subtitle1">Analysis Setup</Typography>
        <Typography color="text.secondary" variant="caption">
          {filledCount} / {REQUIRED_FIELDS.length} configured
        </Typography>
      </PanelHeader>

      <Divider />

      <Box sx={{ p: 0 }}>
        {FIELD_ORDER.map((key) => {
          const field: SchemaFieldState = schema[key];
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
                <StatusIndicator status={field.status} />
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
