import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  TextField,
  Typography,
} from "@mui/material";
import { useLLMUnifiedSearch } from "../../../hooks/useLLMUnifiedSearch";
import { SearchResults } from "../SearchResults/searchResults";
import {
  ResultsContainer,
  SearchContainer,
  SearchForm,
  SearchFormContainer,
  SearchHelperText,
  WorkflowCard,
} from "./unifiedSearch.styles";

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

export const UnifiedSearch = (): JSX.Element => {
  const [query, setQuery] = useState("");
  const { data, search, status } = useLLMUnifiedSearch();

  const handleSearch = (): void => {
    search(query);
  };

  const handleKeyPress = (e: React.KeyboardEvent): void => {
    if (e.key === "Enter" && !status.loading && query.trim()) {
      handleSearch();
    }
  };

  const hasError = !!status.errors.query || !!status.errors.search;
  const errorMessage = status.errors.query || status.errors.search;

  const hasDatasets = data?.datasets && data.datasets.results.length > 0;
  const hasWorkflows =
    data?.workflows && data.workflows.recommended_workflows.length > 0;

  return (
    <SearchContainer>
      <SearchFormContainer>
        <SearchForm>
          <TextField
            fullWidth
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Describe what you're looking for..."
            variant="outlined"
            error={hasError}
            helperText={hasError ? errorMessage : ""}
            disabled={status.loading}
            multiline
            rows={3}
            InputProps={{
              endAdornment: status.loading ? (
                <CircularProgress size={20} />
              ) : null,
            }}
            sx={{
              "& .MuiInputBase-multiline": {
                padding: 0,
              },
              "& .MuiOutlinedInput-notchedOutline": {
                borderColor: "rgba(0, 0, 0, 0.23)",
              },
              "& .MuiOutlinedInput-root": {
                fontSize: "16px",
                lineHeight: "24px",
                padding: "16px",
              },
              "&:hover .MuiOutlinedInput-notchedOutline": {
                borderColor: "rgba(0, 0, 0, 0.87)",
              },
            }}
          />

          <Button
            onClick={handleSearch}
            disabled={status.loading || !query.trim()}
            variant="contained"
            size="large"
            sx={{
              alignSelf: "flex-start",
              height: "56px",
              minWidth: "140px",
            }}
          >
            {status.loading ? "Searching..." : "Search"}
          </Button>
        </SearchForm>

        <SearchHelperText>
          <Typography variant="body2" color="text.secondary">
            Try: &quot;Find HIV RNA-seq data and suggest analysis
            workflows&quot; or &quot;Malaria parasite genome sequencing from
            2023&quot;
          </Typography>
        </SearchHelperText>
      </SearchFormContainer>

      {data && (
        <Box sx={{ mt: 4 }}>
          {hasDatasets && data.datasets && (
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" gutterBottom>
                Datasets ({data.datasets.count})
              </Typography>
              <SearchResults
                response={{
                  cached: data.datasets.cached,
                  count: data.datasets.count,
                  interpretation: data.interpretation,
                  llm_tokens_used: data.llm_tokens_used,
                  metadata: {
                    interpretation_cached: data.datasets.cached,
                    model_used: data.model_used,
                    search_cached: data.datasets.cached,
                  },
                  query: data.query,
                  results: data.datasets.results,
                  search_method: data.datasets.search_method,
                  status: data.status,
                }}
              />
            </Box>
          )}

          {hasDatasets && hasWorkflows && <Divider sx={{ my: 4 }} />}

          {hasWorkflows && data.workflows && (
            <ResultsContainer>
              <Box>
                <Typography variant="h6" gutterBottom>
                  Recommended Workflows ({data.workflows.count})
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Based on your query: {data.query}
                </Typography>
              </Box>

              {data.workflows.recommended_workflows.map((workflow, index) => (
                <WorkflowCard key={index}>
                  <Box
                    sx={{ display: "flex", justifyContent: "space-between" }}
                  >
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
                  {data.llm_tokens_used &&
                    ` • ${data.llm_tokens_used} tokens used`}
                </Typography>
              )}
            </ResultsContainer>
          )}

          {!hasDatasets && !hasWorkflows && (
            <Alert severity="info">
              No results found. Try refining your query with more specific terms
              about datasets (organism names, experiment types) or analysis
              goals (workflows, pipelines).
            </Alert>
          )}
        </Box>
      )}
    </SearchContainer>
  );
};
