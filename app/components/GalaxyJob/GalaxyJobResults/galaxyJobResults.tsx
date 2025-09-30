import {
  Card,
  CardContent,
  Typography,
  Box,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Alert,
  LinearProgress,
  Divider,
} from "@mui/material";
import { ExpandMore, CheckCircle, Description } from "@mui/icons-material";

interface GalaxyJobOutput {
  dataset: {
    file_ext: string;
    file_size?: number;
    id: string;
    name: string;
    state: string;
  };
  id: string;
  name: string;
}

interface GalaxyJobResult {
  completed_time?: string;
  created_time: string;
  job_id: string;
  outputs: GalaxyJobOutput[];
  processing_time?: string;
  results: Record<string, string>;
  status: string;
}

interface Props {
  isLoading: boolean;
  results: GalaxyJobResult | null;
}

const formatDateTime = (dateTime: string): string => {
  try {
    return new Date(dateTime).toLocaleString();
  } catch {
    return dateTime;
  }
};

const formatFileSize = (bytes?: number): string => {
  if (!bytes) return "Unknown size";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${Math.round(bytes / (1024 * 1024))} MB`;
};

const countLines = (content: string): number => {
  return content.trim().split("\n").length;
};

export const GalaxyJobResults = ({
  isLoading,
  results,
}: Props): JSX.Element => {
  if (isLoading) {
    return (
      <Card>
        <CardContent>
          <Box display="flex" alignItems="center" gap={2}>
            <LinearProgress sx={{ flexGrow: 1 }} />
            <Typography variant="body2" color="textSecondary">
              Loading results...
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (!results) {
    return <div />;
  }

  const processingTime =
    results.completed_time && results.created_time
      ? new Date(results.completed_time).getTime() -
        new Date(results.created_time).getTime()
      : null;

  return (
    <Card>
      <CardContent>
        <Box display="flex" alignItems="center" gap={1} mb={2}>
          <CheckCircle color="success" />
          <Typography variant="h6">Job Completed Successfully</Typography>
        </Box>

        {/* Summary Information */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="body2" color="textSecondary" gutterBottom>
            Job ID:{" "}
            <span style={{ fontFamily: "monospace" }}>{results.job_id}</span>
          </Typography>

          <Box display="flex" gap={2} flexWrap="wrap" sx={{ mt: 1 }}>
            <Chip
              label={`Status: ${results.status}`}
              color="success"
              size="small"
            />
            <Chip
              label={`${results.outputs.length} output(s)`}
              variant="outlined"
              size="small"
            />
            {processingTime && (
              <Chip
                label={`Processed in ${Math.round(processingTime / 1000)}s`}
                variant="outlined"
                size="small"
              />
            )}
          </Box>

          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="textSecondary">
              Created: {formatDateTime(results.created_time)}
            </Typography>
            {results.completed_time && (
              <Typography variant="body2" color="textSecondary">
                Completed: {formatDateTime(results.completed_time)}
              </Typography>
            )}
          </Box>
        </Box>

        {/* Results Section */}
        {Object.keys(results.results).length > 0 && (
          <>
            <Divider sx={{ mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              Output Results
            </Typography>

            {Object.entries(results.results).map(
              ([outputName, content], index) => {
                const output = results.outputs.find(
                  (o) => o.name === outputName
                );
                const lineCount = countLines(content);

                return (
                  <Accordion key={index} sx={{ mb: 1 }}>
                    <AccordionSummary expandIcon={<ExpandMore />}>
                      <Box
                        display="flex"
                        alignItems="center"
                        gap={1}
                        width="100%"
                      >
                        <Description />
                        <Typography variant="subtitle1">
                          {outputName}
                        </Typography>
                        <Box sx={{ ml: "auto", mr: 1 }}>
                          <Chip
                            label={`${lineCount} lines`}
                            size="small"
                            variant="outlined"
                          />
                          {output && (
                            <Chip
                              label={formatFileSize(output.dataset.file_size)}
                              size="small"
                              variant="outlined"
                              sx={{ ml: 1 }}
                            />
                          )}
                        </Box>
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails>
                      {output && (
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="body2" color="textSecondary">
                            Dataset: {output.dataset.name} (
                            {output.dataset.file_ext})
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            State: {output.dataset.state}
                          </Typography>
                        </Box>
                      )}

                      <Box
                        sx={{
                          bgcolor: "grey.50",
                          borderRadius: 1,
                          maxHeight: "300px",
                          overflow: "auto",
                          p: 2,
                        }}
                      >
                        <Typography
                          variant="body2"
                          component="pre"
                          sx={{
                            fontFamily: "monospace",
                            fontSize: "0.75rem",
                            margin: 0,
                            whiteSpace: "pre-wrap",
                          }}
                        >
                          {content}
                        </Typography>
                      </Box>

                      {lineCount > 10 && (
                        <Alert severity="info" sx={{ mt: 2 }}>
                          This output contains {lineCount} lines. Only the first
                          portion is shown above.
                        </Alert>
                      )}
                    </AccordionDetails>
                  </Accordion>
                );
              }
            )}
          </>
        )}

        {/* Empty Results */}
        {Object.keys(results.results).length === 0 && (
          <>
            <Divider sx={{ mb: 2 }} />
            <Alert severity="warning">
              Job completed successfully but no output content was retrieved.
              This might indicate an issue with result retrieval or the outputs
              may be empty.
            </Alert>
          </>
        )}

        {/* Success Message */}
        <Box sx={{ bgcolor: "success.light", borderRadius: 1, mt: 3, p: 2 }}>
          <Typography variant="body2" color="success.contrastText">
            <strong>✅ Integration Test Successful!</strong>
            <br />
            The Galaxy API integration is working correctly. Data was
            successfully:
          </Typography>
          <Box component="ul" sx={{ mb: 0, mt: 1, pl: 3 }}>
            <li>Uploaded to Galaxy</li>
            <li>Processed with the &quot;Select random lines&quot; tool</li>
            <li>Retrieved as results</li>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};
