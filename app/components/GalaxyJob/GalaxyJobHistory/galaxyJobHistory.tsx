import React from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Chip,
  Typography,
} from "@mui/material";
import { ExpandMore, Delete, History } from "@mui/icons-material";

interface GalaxyJobHistoryItem {
  completed_time?: string;
  created_time: string;
  filename?: string;
  job_id: string;
  num_random_lines: number;
  results?: Record<string, string>;
  status: string;
  tabular_data: string;
  updated_time?: string;
}

interface GalaxyJobHistoryProps {
  jobHistory: GalaxyJobHistoryItem[];
  onClearHistory: () => void;
}

const getStatusColor = (status: string): string => {
  switch (status.toLowerCase()) {
    case "ok":
    case "completed":
      return "success";
    case "running":
    case "queued":
    case "submitted":
      return "info";
    case "paused":
      return "warning";
    case "error":
    case "failed":
      return "error";
    default:
      return "default";
  }
};

const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return date.toLocaleString();
  } catch {
    return dateString;
  }
};

const truncateText = (text: string, maxLength: number): string => {
  return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
};

export const GalaxyJobHistory: React.FC<GalaxyJobHistoryProps> = ({
  jobHistory,
  onClearHistory,
}) => {
  if (jobHistory.length === 0) {
    return (
      <Box sx={{ border: "1px dashed #ccc", borderRadius: 1, mt: 3, p: 2 }}>
        <Typography variant="body2" color="textSecondary" align="center">
          <History sx={{ mr: 1, verticalAlign: "middle" }} />
          No job history yet. Submit a job to see it appear here.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ mt: 3 }}>
      <Box
        sx={{
          alignItems: "center",
          display: "flex",
          justifyContent: "space-between",
          mb: 2,
        }}
      >
        <Typography variant="h6" component="h2">
          <History sx={{ mr: 1, verticalAlign: "middle" }} />
          Job History ({jobHistory.length})
        </Typography>
        <Button
          variant="outlined"
          color="error"
          size="small"
          startIcon={<Delete />}
          onClick={onClearHistory}
        >
          Clear History
        </Button>
      </Box>

      <Box sx={{ maxHeight: "400px", overflowY: "auto" }}>
        {jobHistory.map((job, index) => (
          <Accordion key={job.job_id} sx={{ mb: 1 }}>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Box
                sx={{
                  alignItems: "center",
                  display: "flex",
                  justifyContent: "space-between",
                  width: "100%",
                }}
              >
                <Box>
                  <Typography variant="subtitle2">
                    Job {index + 1}: {job.job_id}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {formatDate(job.created_time)} • {job.num_random_lines}{" "}
                    lines
                    {job.filename && ` • ${job.filename}`}
                  </Typography>
                </Box>
                <Chip
                  label={job.status}
                  color={
                    getStatusColor(job.status) as
                      | "default"
                      | "error"
                      | "info"
                      | "success"
                      | "warning"
                  }
                  size="small"
                  sx={{ ml: 2 }}
                />
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Job Details:
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Job ID:</strong> {job.job_id}
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Created:</strong> {formatDate(job.created_time)}
                </Typography>
                {job.updated_time && (
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>Updated:</strong> {formatDate(job.updated_time)}
                  </Typography>
                )}
                {job.completed_time && (
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>Completed:</strong> {formatDate(job.completed_time)}
                  </Typography>
                )}
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Random Lines:</strong> {job.num_random_lines}
                </Typography>
                {job.filename && (
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>Filename:</strong> {job.filename}
                  </Typography>
                )}
                <Typography variant="subtitle2" sx={{ mb: 1, mt: 2 }}>
                  Input Data:
                </Typography>
                <Box
                  sx={{
                    backgroundColor: "#f5f5f5",
                    border: "1px solid #ddd",
                    borderRadius: 1,
                    maxHeight: "150px",
                    overflowY: "auto",
                    p: 1,
                  }}
                >
                  <Typography
                    variant="body2"
                    component="pre"
                    sx={{ fontFamily: "monospace", fontSize: "0.75rem" }}
                  >
                    {truncateText(job.tabular_data, 500)}
                  </Typography>
                </Box>

                {job.results && (
                  <>
                    <Typography variant="subtitle2" sx={{ mb: 1, mt: 2 }}>
                      Job Results:
                    </Typography>
                    {((): JSX.Element[] => {
                      console.log(
                        `📋 Displaying results for job ${job.job_id}:`,
                        job.results
                      );
                      return Object.entries(job.results).map(
                        ([name, content]) => (
                          <Box key={name} sx={{ mb: 2 }}>
                            <Typography variant="body2" sx={{ mb: 1 }}>
                              <strong>{name}:</strong>
                            </Typography>
                            <Box
                              sx={{
                                backgroundColor: "#f0f8ff",
                                border: "1px solid #4caf50",
                                borderRadius: 1,
                                maxHeight: "200px",
                                overflowY: "auto",
                                p: 1,
                              }}
                            >
                              <Typography
                                variant="body2"
                                component="pre"
                                sx={{
                                  fontFamily: "monospace",
                                  fontSize: "0.75rem",
                                }}
                              >
                                {content}
                              </Typography>
                            </Box>
                          </Box>
                        )
                      );
                    })()}
                  </>
                )}
              </Box>
            </AccordionDetails>
          </Accordion>
        ))}
      </Box>
    </Box>
  );
};
