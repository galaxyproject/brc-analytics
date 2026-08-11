import { ControlRow } from "@brc/components/LoganSearch/loganSearch.styles";
import {
  Alert,
  Card,
  CardContent,
  Chip,
  LinearProgress,
  Typography,
} from "@mui/material";
import { type useKmindexSearch } from "@repo/shared/hooks/useKmindexSearch";
import { type JSX } from "react";

interface LoganSearchStatusProps {
  search: ReturnType<typeof useKmindexSearch>;
}

const STATE_COLORS: Record<
  string,
  "default" | "error" | "info" | "success" | "warning"
> = {
  error: "error",
  new: "default",
  ok: "success",
  queued: "warning",
  running: "info",
};

// Galaxy's own vocabulary is terse; these read better next to a spinner.
const STATE_LABELS: Record<string, string> = {
  new: "Submitted",
  ok: "Complete",
  queued: "Queued on Vista",
  running: "Searching the index",
};

export const LoganSearchStatus = ({
  search,
}: LoganSearchStatusProps): JSX.Element | null => {
  const { error, isLoadingResults, jobId, jobStatus, results } = search;

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {error}
      </Alert>
    );
  }

  if (!jobId) return null;

  const state = jobStatus?.state ?? "new";
  const isDone = Boolean(results);

  return (
    <Card sx={{ mt: 2 }}>
      <CardContent>
        <ControlRow>
          <Typography variant="subtitle1">Job {jobId}</Typography>
          <Chip
            color={STATE_COLORS[state] ?? "default"}
            label={STATE_LABELS[state] ?? state}
            size="small"
          />
        </ControlRow>
        {!isDone && <LinearProgress sx={{ mt: 2 }} />}
        {isLoadingResults && (
          <Typography color="textSecondary" sx={{ mt: 1 }} variant="body2">
            Merging hits across index shards -- this takes a moment the first
            time.
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};
