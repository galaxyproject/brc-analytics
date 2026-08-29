import { ControlRow } from "@brc/components/LoganSearch/loganSearch.styles";
import { ROUTES } from "@brc/routes/constants";
import { AutoAwesome } from "@mui/icons-material";
import { Button, Card, CardContent, Typography } from "@mui/material";
import { type useKmindexSearch } from "@repo/shared/hooks/useKmindexSearch";
import Link from "next/link";
import { type JSX } from "react";

interface LoganSearchAnalyzeProps {
  search: ReturnType<typeof useKmindexSearch>;
}

/**
 * The way from a finished search into the Analysis Assistant, which opens
 * with this job's cohort as context. Shown only once results are loaded --
 * the assistant reads the cached aggregate this page just built.
 * @param props - Component props.
 * @param props.search - The kmindex search hook.
 * @returns The card, or null before results exist.
 */
export const LoganSearchAnalyze = ({
  search,
}: LoganSearchAnalyzeProps): JSX.Element | null => {
  const { jobId, results } = search;
  if (!jobId || !results) return null;
  const href = `${ROUTES.ASSISTANT}?loganJob=${encodeURIComponent(jobId)}`;
  return (
    <Card sx={{ mt: 2 }}>
      <CardContent>
        <ControlRow>
          <div>
            <Typography variant="subtitle1">
              What can you do with this?
            </Typography>
            <Typography color="textSecondary" variant="body2">
              The assistant can explain what this cohort is, say which of its
              organisms are in BRC, and set up a Galaxy analysis on the top
              runs.
            </Typography>
          </div>
          <Button
            component={Link}
            href={href}
            startIcon={<AutoAwesome />}
            variant="contained"
          >
            Ask the assistant
          </Button>
        </ControlRow>
      </CardContent>
    </Card>
  );
};
