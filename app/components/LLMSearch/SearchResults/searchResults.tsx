import { Typography, Card, CardContent, Chip, Box } from "@mui/material";
import { DatasetSearchResponse } from "../../../types/api";
import {
  ResultsContainer,
  InterpretationCard,
  ResultCard,
  ResultHeader,
  ResultMeta,
  ChipContainer,
  ResultStats,
  ResultTitle,
} from "./searchResults.styles";

interface SearchResultsProps {
  response: DatasetSearchResponse;
}

/**
 * Maps technical search method values to user-friendly display names
 * @param method - Technical search method from backend
 * @returns User-friendly display name
 */
function getSearchMethodDisplay(method: string): string {
  const methodMap: Record<string, string> = {
    failed: "Search encountered an error",
    keywords: "Keyword-based search",
    none: "No search performed",
    taxonomy: "Taxonomy-based search",
  };
  return methodMap[method] || method;
}

export const SearchResults = ({
  response,
}: SearchResultsProps): JSX.Element => {
  const { count, interpretation, metadata, results } = response;

  return (
    <ResultsContainer>
      {/* Query Interpretation Summary */}
      <InterpretationCard>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Query Interpretation
          </Typography>

          <Box
            display="grid"
            gridTemplateColumns="repeat(auto-fit, minmax(250px, 1fr))"
            gap={2}
            sx={{ mb: 2 }}
          >
            {interpretation.organism && (
              <Typography variant="body2" color="text.secondary">
                <strong>Organism:</strong> {interpretation.organism}
              </Typography>
            )}

            {interpretation.experiment_type && (
              <Typography variant="body2" color="text.secondary">
                <strong>Experiment:</strong> {interpretation.experiment_type}
              </Typography>
            )}

            {interpretation.library_strategy && (
              <Typography variant="body2" color="text.secondary">
                <strong>Library Strategy:</strong>{" "}
                {interpretation.library_strategy}
              </Typography>
            )}

            {interpretation.date_range && (
              <Typography variant="body2" color="text.secondary">
                <strong>Date Range:</strong> {interpretation.date_range.start} -{" "}
                {interpretation.date_range.end}
              </Typography>
            )}
          </Box>

          {interpretation.keywords.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                <strong>Keywords:</strong>
              </Typography>
              <ChipContainer>
                {interpretation.keywords.map((keyword, idx) => (
                  <Chip
                    key={idx}
                    label={keyword}
                    size="small"
                    variant="outlined"
                  />
                ))}
              </ChipContainer>
            </Box>
          )}

          <Box display="flex" flexDirection="column" gap={1}>
            <Typography variant="body2" color="text.secondary">
              <strong>Confidence:</strong>{" "}
              {Math.round(interpretation.confidence * 100)}%
            </Typography>

            {metadata?.model_used && (
              <Typography variant="body2" color="text.secondary">
                <strong>AI Models:</strong> {metadata.model_used}
              </Typography>
            )}

            <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
              {metadata?.interpretation_cached && (
                <Chip
                  label="Interpretation Cached"
                  size="small"
                  color="success"
                  variant="outlined"
                />
              )}
              {metadata?.search_cached && (
                <Chip
                  label="Search Cached"
                  size="small"
                  color="success"
                  variant="outlined"
                />
              )}
              {response.llm_tokens_used && (
                <Typography variant="caption" color="text.secondary">
                  Tokens: {response.llm_tokens_used.toLocaleString()}
                </Typography>
              )}
            </Box>
          </Box>
        </CardContent>
      </InterpretationCard>

      {/* Results */}
      <Box>
        <ResultStats>
          <Typography variant="h6">
            Found {count.toLocaleString()} dataset{count !== 1 ? "s" : ""}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Search method: {getSearchMethodDisplay(response.search_method)}
          </Typography>
        </ResultStats>

        {results.length > 0 ? (
          <Box display="flex" flexDirection="column" gap={2}>
            {results.map((result, idx) => (
              <ResultCard key={idx}>
                <CardContent>
                  <ResultHeader>
                    <Box>
                      <ResultTitle variant="h6">
                        {result.study_title || result.accession}
                      </ResultTitle>
                      {result.study_title && (
                        <Typography variant="body2" color="text.secondary">
                          {result.accession}
                        </Typography>
                      )}
                    </Box>
                    <Chip
                      label={result.library_strategy}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  </ResultHeader>

                  <ResultMeta>
                    <Box
                      display="grid"
                      gridTemplateColumns="repeat(auto-fit, minmax(200px, 1fr))"
                      gap={2}
                    >
                      <Typography variant="body2" color="text.secondary">
                        <strong>Organism:</strong>
                        <br />
                        {result.scientific_name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        <strong>Library Source:</strong>
                        <br />
                        {result.library_source}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        <strong>Read Count:</strong>
                        <br />
                        {result.read_count?.toLocaleString() || "N/A"}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        <strong>First Public:</strong>
                        <br />
                        {result.first_public
                          ? new Date(result.first_public).toLocaleDateString()
                          : "N/A"}
                      </Typography>
                      {result.instrument_model && (
                        <Typography variant="body2" color="text.secondary">
                          <strong>Instrument:</strong>
                          <br />
                          {result.instrument_model}
                        </Typography>
                      )}
                      {result.library_layout && (
                        <Typography variant="body2" color="text.secondary">
                          <strong>Layout:</strong>
                          <br />
                          {result.library_layout}
                        </Typography>
                      )}
                      {result.collection_date && (
                        <Typography variant="body2" color="text.secondary">
                          <strong>Collection Date:</strong>
                          <br />
                          {result.collection_date}
                        </Typography>
                      )}
                    </Box>
                  </ResultMeta>

                  <Box display="flex" gap={1} flexWrap="wrap" mt={2}>
                    <Chip
                      label={result.run_accession}
                      size="small"
                      variant="outlined"
                    />
                    <Chip
                      label={result.experiment_accession}
                      size="small"
                      variant="outlined"
                    />
                    <Chip
                      label={result.sample_accession}
                      size="small"
                      variant="outlined"
                    />
                  </Box>
                </CardContent>
              </ResultCard>
            ))}
          </Box>
        ) : (
          <Card>
            <CardContent>
              <Typography
                variant="body1"
                color="text.secondary"
                textAlign="center"
              >
                No datasets found matching your query. Try adjusting your search
                terms.
              </Typography>
            </CardContent>
          </Card>
        )}
      </Box>
    </ResultsContainer>
  );
};
