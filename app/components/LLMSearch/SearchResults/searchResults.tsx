import { useState } from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Card,
  CardContent,
  Chip,
  Typography,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { DatasetSearchResponse, ENAStudyGroup } from "../../../types/api";
import {
  ChipContainer,
  InterpretationCard,
  ResultCard,
  ResultHeader,
  ResultMeta,
  ResultStats,
  ResultTitle,
  ResultsContainer,
} from "./searchResults.styles";

interface SearchResultsProps {
  groupedStudies?: ENAStudyGroup[];
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
  groupedStudies,
  response,
}: SearchResultsProps): JSX.Element => {
  const { interpretation, metadata, results } = response;
  const [expandedStudies, setExpandedStudies] = useState<string[]>([]);

  const handleAccordionChange = (
    studyAccession: string,
    isExpanded: boolean
  ): void => {
    setExpandedStudies((prev) =>
      isExpanded
        ? [...prev, studyAccession]
        : prev.filter((acc) => acc !== studyAccession)
    );
  };

  const renderRun = (result: (typeof results)[0], idx: number): JSX.Element => (
    <ResultCard key={idx}>
      <CardContent>
        <ResultHeader>
          <Box>
            <ResultTitle variant="h6">
              {result.experiment_title ||
                result.sample_title ||
                result.accession}
            </ResultTitle>
            {(result.experiment_title || result.sample_title) && (
              <Typography variant="body2" color="text.secondary">
                {result.accession}
              </Typography>
            )}
          </Box>
          <Chip
            color="primary"
            label={result.library_strategy}
            size="small"
            variant="outlined"
          />
        </ResultHeader>

        <ResultMeta>
          <Box
            display="grid"
            gap={2}
            gridTemplateColumns="repeat(auto-fit, minmax(200px, 1fr))"
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

        <Box display="flex" flexWrap="wrap" gap={1} mt={2}>
          <Chip label={result.run_accession} size="small" variant="outlined" />
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
  );

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
          <Typography variant="body2" color="text.secondary">
            Search method: {getSearchMethodDisplay(response.search_method)}
          </Typography>
        </ResultStats>

        {results.length === 0 && (
          <Card>
            <CardContent>
              <Typography
                color="text.secondary"
                textAlign="center"
                variant="body1"
              >
                No datasets found matching your query. Try adjusting your search
                terms.
              </Typography>
            </CardContent>
          </Card>
        )}

        {results.length > 0 && groupedStudies && groupedStudies.length > 0 && (
          /* Grouped by study display */
          <Box display="flex" flexDirection="column" gap={2}>
            {groupedStudies.map((study) => (
              <Accordion
                expanded={expandedStudies.includes(study.study_accession)}
                key={study.study_accession}
                onChange={(_event, isExpanded) =>
                  handleAccordionChange(study.study_accession, isExpanded)
                }
              >
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box
                    sx={{
                      alignItems: "center",
                      display: "flex",
                      gap: 2,
                      width: "100%",
                    }}
                  >
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h6">{study.study_title}</Typography>
                      <Typography color="text.secondary" variant="body2">
                        {study.study_accession}
                      </Typography>
                    </Box>
                    <Chip
                      label={`${study.run_count} run${study.run_count !== 1 ? "s" : ""}`}
                      size="small"
                      variant="outlined"
                    />
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Box display="flex" flexDirection="column" gap={2}>
                    {study.runs.map((run, idx) => renderRun(run, idx))}
                  </Box>
                </AccordionDetails>
              </Accordion>
            ))}
          </Box>
        )}

        {results.length > 0 &&
          (!groupedStudies || groupedStudies.length === 0) && (
            /* Flat list display */
            <Box display="flex" flexDirection="column" gap={2}>
              {results.map((result, idx) => renderRun(result, idx))}
            </Box>
          )}
      </Box>
    </ResultsContainer>
  );
};
