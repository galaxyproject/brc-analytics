import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  TextField,
  Typography,
} from "@mui/material";
import { useLLMWorkflowSuggestion } from "../../../hooks/useLLMWorkflowSuggestion";
import {
  ResultsContainer,
  SuggestionContainer,
  SuggestionForm,
  SuggestionFormContainer,
  SuggestionHelperText,
  WorkflowCard,
} from "./workflowSuggestion.styles";

/**
 * Get chip color based on confidence level
 * @param confidence - Confidence value between 0 and 1
 * @returns Chip color
 */
const getConfidenceColor = (
  confidence: number
): "success" | "warning" | "default" => {
  if (confidence >= 0.7) return "success";
  if (confidence >= 0.5) return "warning";
  return "default";
};

export const WorkflowSuggestion = (): JSX.Element => {
  const [datasetDescription, setDatasetDescription] = useState("");
  const [analysisGoal, setAnalysisGoal] = useState("");
  const { data, status, suggest } = useLLMWorkflowSuggestion();

  const handleSuggest = (): void => {
    suggest({
      analysis_goal: analysisGoal,
      dataset_description: datasetDescription,
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent): void => {
    if (
      e.key === "Enter" &&
      e.ctrlKey &&
      !status.loading &&
      datasetDescription.trim() &&
      analysisGoal.trim()
    ) {
      handleSuggest();
    }
  };

  const hasDescriptionError = !!status.errors.dataset_description;
  const hasGoalError = !!status.errors.analysis_goal;
  const hasSuggestionError = !!status.errors.suggestion;

  return (
    <SuggestionContainer>
      <SuggestionFormContainer>
        <SuggestionForm>
          <TextField
            fullWidth
            value={datasetDescription}
            onChange={(e) => setDatasetDescription(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Describe your dataset..."
            label="Dataset Description"
            variant="outlined"
            error={hasDescriptionError}
            helperText={
              hasDescriptionError
                ? status.errors.dataset_description
                : "Example: RNA-seq paired-end reads from Plasmodium falciparum"
            }
            disabled={status.loading}
            multiline
            rows={2}
            required
          />

          <TextField
            fullWidth
            value={analysisGoal}
            onChange={(e) => setAnalysisGoal(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="What do you want to analyze?"
            label="Analysis Goal"
            variant="outlined"
            error={hasGoalError}
            helperText={
              hasGoalError
                ? status.errors.analysis_goal
                : "Example: Identify differentially expressed genes between drug-treated and control samples"
            }
            disabled={status.loading}
            multiline
            rows={2}
            required
          />

          <Button
            onClick={handleSuggest}
            disabled={
              status.loading ||
              !datasetDescription.trim() ||
              !analysisGoal.trim()
            }
            variant="contained"
            size="large"
            sx={{
              alignSelf: "flex-start",
              height: "56px",
              minWidth: "180px",
            }}
          >
            {status.loading ? (
              <>
                <CircularProgress size={20} sx={{ mr: 1 }} />
                Analyzing...
              </>
            ) : (
              "Suggest Workflows"
            )}
          </Button>
        </SuggestionForm>

        <SuggestionHelperText>
          <Typography variant="body2" color="text.secondary">
            Press Ctrl+Enter to submit. We&apos;ll recommend Galaxy workflows
            based on your dataset and analysis goals.
          </Typography>
        </SuggestionHelperText>
      </SuggestionFormContainer>

      {hasSuggestionError && (
        <Alert severity="error">{status.errors.suggestion}</Alert>
      )}

      {data && data.recommended_workflows.length > 0 && (
        <ResultsContainer>
          <Box>
            <Typography variant="h6" gutterBottom>
              Recommended Workflows ({data.count})
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Based on: {data.dataset_description}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Goal: {data.analysis_goal}
            </Typography>
          </Box>

          {data.recommended_workflows.map((workflow, index) => (
            <WorkflowCard key={index}>
              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Typography variant="h6" gutterBottom>
                  {workflow.workflow_name}
                </Typography>
                <Chip
                  label={`${Math.round(workflow.confidence * 100)}% confidence`}
                  size="small"
                  color={getConfidenceColor(workflow.confidence)}
                />
              </Box>

              <Typography variant="body2" paragraph>
                {workflow.reasoning}
              </Typography>

              {workflow.compatibility_notes && (
                <Alert severity="info" sx={{ mt: 1 }}>
                  {workflow.compatibility_notes}
                </Alert>
              )}

              {workflow.workflow_id && (
                <Typography variant="caption" color="text.secondary">
                  ID: {workflow.workflow_id}
                </Typography>
              )}
            </WorkflowCard>
          ))}

          {data.model_used && (
            <Typography variant="caption" color="text.secondary">
              Powered by {data.model_used}
              {data.llm_tokens_used && ` • ${data.llm_tokens_used} tokens used`}
            </Typography>
          )}
        </ResultsContainer>
      )}

      {data && data.recommended_workflows.length === 0 && (
        <Alert severity="warning">
          No workflows found matching your criteria. Try adjusting your dataset
          description or analysis goal.
        </Alert>
      )}
    </SuggestionContainer>
  );
};
