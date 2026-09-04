import { Box, Button, Paper, Typography } from "@mui/material";
import type { LoganContext } from "@repo/shared/services/api-client/types";
import Link from "next/link";
import { type JSX } from "react";

interface LoganCohortCardProps {
  logan: LoganContext;
}

/**
 * The Logan search this conversation was opened from: job, size, top
 * organism, and the way back to the full results.
 * @param props - Component props.
 * @param props.logan - Cohort context from the assistant API.
 * @returns The card.
 */
export const LoganCohortCard = ({
  logan,
}: LoganCohortCardProps): JSX.Element => {
  const runs = logan.total_matches.toLocaleString("en-US");
  const share =
    logan.top_organism_share === null
      ? null
      : `${Math.round(logan.top_organism_share * 100)}%`;
  return (
    <Paper sx={{ mb: 2, p: 2 }} variant="outlined">
      <Typography variant="subtitle2">Logan search {logan.job_id}</Typography>
      <Typography color="text.secondary" sx={{ mt: 0.5 }} variant="body2">
        {runs} runs
        {logan.top_organism && share
          ? ` · ${logan.top_organism} ${share}`
          : " · metadata unavailable"}
      </Typography>
      <Box sx={{ mt: 1.5 }}>
        <Button
          component={Link}
          href={logan.results_url}
          size="small"
          variant="outlined"
        >
          View results
        </Button>
      </Box>
    </Paper>
  );
};
