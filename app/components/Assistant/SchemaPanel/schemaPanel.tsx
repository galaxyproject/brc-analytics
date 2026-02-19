import { JSX } from "react";
import { Box, Button, Chip, Divider, Typography } from "@mui/material";
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
  isComplete: boolean;
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

const FIELD_ORDER: (keyof AnalysisSchema)[] = [
  "organism",
  "assembly",
  "analysis_type",
  "workflow",
  "data_source",
  "data_characteristics",
  "gene_annotation",
];

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
 * @param props.isComplete - Whether the analysis config is complete
 * @param props.schema - Current analysis schema state
 * @returns Schema panel element
 */
export const SchemaPanel = ({
  handoffUrl,
  isComplete,
  schema,
}: SchemaPanelProps): JSX.Element => {
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

  const filledCount = FIELD_ORDER.filter(
    (key) => schema[key].status === "filled"
  ).length;

  return (
    <PanelContainer>
      <PanelHeader>
        <Typography variant="subtitle1">Analysis Setup</Typography>
        <Typography color="text.secondary" variant="caption">
          {filledCount} / {FIELD_ORDER.length} configured
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

      {isComplete && (
        <Box sx={{ p: 2 }}>
          <Button
            fullWidth
            href={handoffUrl || "#"}
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
