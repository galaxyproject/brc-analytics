import { useState } from "react";
import {
  Button,
  TextField,
  Typography,
  Card,
  CardContent,
  Alert,
  Chip,
  Box,
  Divider,
} from "@mui/material";
import { PlayArrow, Refresh, Stop } from "@mui/icons-material";
import { useGalaxyJob } from "../../../hooks/useGalaxyJob";
import { GalaxyJobStatus } from "../GalaxyJobStatus/galaxyJobStatus";
import {
  FormContainer,
  FormSection,
  InputSection,
  ControlSection,
} from "./galaxyJobForm.styles";

interface GalaxyJobFormProps {
  galaxyJobHook: ReturnType<typeof useGalaxyJob>;
}

// Sample data for testing
const SAMPLE_DATA = `Sample_ID	Gene	Position	Ref	Alt	Depth	Quality	Effect
S001	ACE2	23403	A	G	156	99	missense_variant
S001	ORF1ab	14408	C	T	203	99	synonymous_variant
S002	Spike	23012	G	A	178	98	missense_variant
S002	Spike	23063	A	T	145	97	missense_variant
S003	ORF8	28144	T	C	234	99	synonymous_variant
S003	N	28881	G	A	189	99	missense_variant
S004	Spike	22995	C	A	167	98	missense_variant
S004	ORF3a	25563	G	T	201	99	missense_variant
S005	M	26530	A	G	178	97	synonymous_variant
S005	E	26256	C	T	156	96	synonymous_variant`;

export const GalaxyJobForm = ({
  galaxyJobHook,
}: GalaxyJobFormProps): JSX.Element => {
  const [tabularData, setTabularData] = useState(SAMPLE_DATA);
  const [numLines, setNumLines] = useState(3);
  const [filename, setFilename] = useState("variant_calls");

  const {
    // Loading and submission state
    isPolling,
    isSubmitting,

    // Job state
    jobId,
    jobResults,
    jobStatus,

    // Error states
    pollingError,
    // Actions
    reset,
    resultsError,
    stopPolling,
    submissionError,
    submitJob,
  } = galaxyJobHook;

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();

    if (!tabularData.trim()) {
      return;
    }

    await submitJob({
      filename: filename || "test_data",
      num_random_lines: numLines,
      tabular_data: tabularData,
    });
  };

  const handleReset = (): void => {
    reset();
    setTabularData(SAMPLE_DATA);
    setNumLines(3);
    setFilename("variant_calls");
  };

  const isJobInProgress = isSubmitting || isPolling;
  const hasActiveJob = Boolean(jobId);

  return (
    <FormContainer>
      <Typography variant="body1" color="textSecondary" paragraph>
        Paste your genomic data below to search for patterns, variants, or
        sequences of interest. Logan Search will analyze your data and return
        matching results.
      </Typography>

      {/* Input Form */}
      <Card>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <FormSection>
              <Typography variant="h6" gutterBottom>
                Input Data
              </Typography>

              <InputSection>
                <TextField
                  label="Filename"
                  value={filename}
                  onChange={(e) => setFilename(e.target.value)}
                  fullWidth
                  size="small"
                  disabled={isJobInProgress}
                />

                <TextField
                  label="Maximum results to return"
                  type="number"
                  value={numLines}
                  onChange={(e) => setNumLines(parseInt(e.target.value) || 1)}
                  inputProps={{ max: 100, min: 1 }}
                  size="small"
                  disabled={isJobInProgress}
                />
              </InputSection>

              <TextField
                label="Tabular Data (TSV format)"
                multiline
                rows={8}
                value={tabularData}
                onChange={(e) => setTabularData(e.target.value)}
                fullWidth
                disabled={isJobInProgress}
                helperText="Enter tab-separated genomic data (e.g., variants, sequences, annotations)"
                sx={{ mt: 2 }}
              />

              <ControlSection>
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={<PlayArrow />}
                  disabled={isJobInProgress || !tabularData.trim()}
                  size="large"
                >
                  {isSubmitting ? "Searching..." : "Search"}
                </Button>

                {isPolling && (
                  <Button
                    onClick={stopPolling}
                    variant="outlined"
                    startIcon={<Stop />}
                    color="warning"
                  >
                    Stop Polling
                  </Button>
                )}

                {hasActiveJob && (
                  <Button
                    onClick={handleReset}
                    variant="outlined"
                    startIcon={<Refresh />}
                    disabled={isJobInProgress}
                  >
                    Reset
                  </Button>
                )}
              </ControlSection>
            </FormSection>
          </form>
        </CardContent>
      </Card>

      {/* Errors */}
      {submissionError && (
        <Alert severity="error" onClose={() => {}}>
          <strong>Submission Error:</strong> {submissionError}
        </Alert>
      )}

      {pollingError && (
        <Alert severity="warning">
          <strong>Polling Error:</strong> {pollingError}
        </Alert>
      )}

      {resultsError && (
        <Alert severity="error">
          <strong>Results Error:</strong> {resultsError}
        </Alert>
      )}

      {/* Job Status and Results (consolidated) */}
      {(jobId || jobStatus) && (
        <>
          <Divider sx={{ my: 3 }} />
          <GalaxyJobStatus
            jobId={jobId}
            status={jobStatus}
            results={jobResults?.results}
            isPolling={isPolling}
          />
        </>
      )}

      {/* Instructions */}
      <Card sx={{ bgcolor: "background.paper", mt: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            How it works
          </Typography>
          <Box component="ol" sx={{ pl: 2 }}>
            <Box component="li" sx={{ mb: 1 }}>
              Data is uploaded to Galaxy using the upload tool
            </Box>
            <Box component="li" sx={{ mb: 1 }}>
              The &quot;Select random lines&quot; tool is executed on the
              uploaded data
            </Box>
            <Box component="li" sx={{ mb: 1 }}>
              Job status is polled every 2 seconds until completion
            </Box>
            <Box component="li" sx={{ mb: 1 }}>
              Results are retrieved and displayed when the job finishes
            </Box>
          </Box>

          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="textSecondary" component="span">
              This demonstrates the complete Galaxy API workflow:
            </Typography>
            <Box sx={{ alignItems: "center", display: "inline-flex", ml: 1 }}>
              <Chip label="Upload" size="small" sx={{ mx: 0.5 }} />
              <span>→</span>
              <Chip label="Execute Tool" size="small" sx={{ mx: 0.5 }} />
              <span>→</span>
              <Chip label="Poll Status" size="small" sx={{ mx: 0.5 }} />
              <span>→</span>
              <Chip label="Get Results" size="small" sx={{ mx: 0.5 }} />
            </Box>
          </Box>
        </CardContent>
      </Card>
    </FormContainer>
  );
};
