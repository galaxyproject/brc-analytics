import {
  Card,
  CardContent,
  Typography,
  Chip,
  LinearProgress,
  Box,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
} from "@mui/material";
import {
  Schedule,
  PlayArrow,
  CheckCircle,
  Error,
  Pause,
  Delete,
  CloudUpload,
  HourglassEmpty,
  ExpandMore,
  Description,
} from "@mui/icons-material";

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

interface GalaxyJobStatus {
  created_time: string;
  exit_code?: number;
  is_complete: boolean;
  is_successful: boolean;
  job_id: string;
  outputs: GalaxyJobOutput[];
  state: string;
  stderr?: string;
  stdout?: string;
  updated_time: string;
}

interface Props {
  isPolling: boolean;
  jobId: string | null;
  results?: Record<string, string> | null;
  status: GalaxyJobStatus | null;
}

const getStateIcon = (state: string): JSX.Element => {
  switch (state) {
    case "new":
      return <Schedule />;
    case "upload":
      return <CloudUpload />;
    case "waiting":
    case "queued":
      return <HourglassEmpty />;
    case "running":
      return <PlayArrow />;
    case "ok":
      return <CheckCircle />;
    case "error":
      return <Error />;
    case "paused":
      return <Pause />;
    case "deleted":
    case "deleted_new":
      return <Delete />;
    default:
      return <Schedule />;
  }
};

const getStateColor = (
  state: string
):
  | "default"
  | "primary"
  | "secondary"
  | "error"
  | "warning"
  | "info"
  | "success" => {
  switch (state) {
    case "ok":
      return "success";
    case "error":
      return "error";
    case "running":
      return "primary";
    case "waiting":
    case "queued":
      return "warning";
    case "paused":
      return "secondary";
    case "deleted":
    case "deleted_new":
      return "error";
    default:
      return "default";
  }
};

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

export const GalaxyJobStatus = ({
  isPolling,
  jobId,
  results,
  status,
}: Props): JSX.Element => {
  if (!jobId) {
    return <div />;
  }

  const isCompleted = status?.is_complete && status?.state === "ok";
  const hasResults = results && Object.keys(results).length > 0;

  return (
    <Card>
      <CardContent>
        <Box display="flex" alignItems="center" gap={1} mb={2}>
          {isCompleted ? (
            <>
              <CheckCircle color="success" />
              <Typography variant="h6">Search Complete</Typography>
            </>
          ) : (
            <Typography variant="h6">Logan Search Status</Typography>
          )}
        </Box>

        <Box
          sx={{
            alignItems: "center",
            display: "flex",
            flexDirection: { sm: "row", xs: "column" },
            gap: 2,
          }}
        >
          <Box display="flex" alignItems="center" gap={1}>
            <Typography variant="body2" color="textSecondary">
              Job ID:
            </Typography>
            <Typography variant="body2" fontFamily="monospace">
              {jobId}
            </Typography>
          </Box>

          <Box>
            <Box
              display="flex"
              alignItems="center"
              gap={1}
              justifyContent="flex-end"
            >
              {isPolling && (
                <Chip
                  label="Polling..."
                  size="small"
                  color="primary"
                  variant="outlined"
                />
              )}
            </Box>
          </Box>
        </Box>

        {status && (
          <>
            <Box sx={{ mt: 2 }}>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                {getStateIcon(status.state)}
                <Chip
                  label={status.state.toUpperCase()}
                  color={getStateColor(status.state)}
                  size="small"
                />
                {!status.is_complete && (
                  <LinearProgress sx={{ flexGrow: 1, ml: 2 }} />
                )}
              </Box>

              <Box
                sx={{
                  display: "flex",
                  flexDirection: { sm: "row", xs: "column" },
                  gap: 2,
                  mt: 1,
                }}
              >
                <Typography variant="body2" color="textSecondary">
                  Created: {formatDateTime(status.created_time)}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Updated: {formatDateTime(status.updated_time)}
                </Typography>
              </Box>

              {status.outputs.length > 0 && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="subtitle2" gutterBottom>
                    Outputs ({status.outputs.length})
                  </Typography>
                  {status.outputs.map((output) => (
                    <Box key={output.id} sx={{ mb: 1 }}>
                      <Typography variant="body2">
                        <strong>{output.name}:</strong> {output.dataset.name}
                        {output.dataset.file_size && (
                          <>
                            {" "}
                            ({Math.round(output.dataset.file_size / 1024)} KB)
                          </>
                        )}
                      </Typography>
                      <Box display="flex" gap={1} mt={0.5}>
                        <Chip
                          label={output.dataset.state}
                          size="small"
                          variant="outlined"
                        />
                        <Chip
                          label={output.dataset.file_ext}
                          size="small"
                          variant="outlined"
                        />
                      </Box>
                    </Box>
                  ))}
                </>
              )}

              {/* Show stderr/stdout for debugging if job failed */}
              {status.state === "error" && (status.stderr || status.stdout) && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="subtitle2" color="error" gutterBottom>
                    Error Information
                  </Typography>
                  {status.stderr && (
                    <Box
                      sx={{
                        bgcolor: "error.light",
                        borderRadius: 1,
                        mb: 1,
                        p: 1,
                      }}
                    >
                      <Typography variant="caption" color="error.contrastText">
                        STDERR:
                      </Typography>
                      <Typography
                        variant="body2"
                        component="pre"
                        sx={{ fontSize: "0.75rem", whiteSpace: "pre-wrap" }}
                      >
                        {status.stderr}
                      </Typography>
                    </Box>
                  )}
                  {status.stdout && (
                    <Box sx={{ bgcolor: "grey.100", borderRadius: 1, p: 1 }}>
                      <Typography variant="caption" color="textSecondary">
                        STDOUT:
                      </Typography>
                      <Typography
                        variant="body2"
                        component="pre"
                        sx={{ fontSize: "0.75rem", whiteSpace: "pre-wrap" }}
                      >
                        {status.stdout}
                      </Typography>
                    </Box>
                  )}
                </>
              )}
            </Box>
          </>
        )}

        {/* Results Section - Show when job is completed successfully */}
        {isCompleted && hasResults && (
          <>
            <Divider sx={{ my: 3 }} />
            <Typography variant="h6" gutterBottom>
              Search Results
            </Typography>

            {Object.entries(results!).map(([outputName, content], index) => {
              const output = status!.outputs.find((o) => o.name === outputName);
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
                      <Typography variant="subtitle1">{outputName}</Typography>
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
            })}

            {/* Success Message */}
            <Box
              sx={{ bgcolor: "success.light", borderRadius: 1, mt: 3, p: 2 }}
            >
              <Typography variant="body2" color="success.contrastText">
                <strong>✅ Analysis Complete!</strong>
                <br />
                Your Logan Search analysis has completed successfully.
              </Typography>
            </Box>
          </>
        )}

        {!status && (
          <Box display="flex" alignItems="center" gap={1} sx={{ mt: 2 }}>
            <LinearProgress sx={{ flexGrow: 1 }} />
            <Typography variant="body2" color="textSecondary">
              Waiting for job status...
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};
