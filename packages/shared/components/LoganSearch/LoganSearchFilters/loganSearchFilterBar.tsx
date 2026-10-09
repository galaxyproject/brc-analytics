import { FilterChips } from "@brc/components/LoganSearch/loganSearch.styles";
import { Download } from "@mui/icons-material";
import {
  Alert,
  Button,
  Card,
  CardContent,
  Chip,
  Typography,
} from "@mui/material";
import { API_BASE_URL } from "@repo/shared/config/api";
import { type KmindexResults } from "@repo/shared/hooks/useKmindexSearch";
import { type KmindexSummaryState } from "@repo/shared/hooks/useKmindexSummary";
import { type JSX, useEffect, useRef, useState } from "react";
import {
  describeYears,
  FIELD_LABELS,
  isEmptyFilters,
  LIST_FIELDS,
  NONE_VALUE,
  toDuckdbWhere,
} from "./filters";
import { type UseLoganFilters } from "./useLoganFilters";

interface LoganSearchFilterBarProps {
  // Why filtering cannot run for this search, or null when it can.
  disabledReason: string | null;
  // Why the last filtered table request was refused, if it was.
  filterError: string | null;
  filtering: UseLoganFilters;
  results: KmindexResults;
  summary: KmindexSummaryState;
}

interface FilterChip {
  key: string;
  label: string;
  onDelete: () => void;
}

const COPY_LABELS = {
  copied: "Copied",
  failed: "Copy failed",
  idle: "Copy as DuckDB WHERE",
};

/**
 * One chip per picked value, year range and score floor.
 * @param filtering - The filter hook.
 * @param isoNames - Display names for ISO codes picked on the map.
 * @returns Chips in a fixed order.
 */
function filterChips(
  filtering: UseLoganFilters,
  isoNames: Record<string, string>
): FilterChip[] {
  const { filters } = filtering;
  const chips: FilterChip[] = [];
  for (const field of LIST_FIELDS) {
    for (const value of filters[field]) {
      let shown = value;
      if (value === NONE_VALUE) shown = "Not recorded";
      else if (field === "country_iso") shown = isoNames[value] ?? value;
      chips.push({
        key: `${field}:${value}`,
        label: `${FIELD_LABELS[field]}: ${shown}`,
        onDelete: () => filtering.toggle(field, value),
      });
    }
  }
  if (filters.year) {
    chips.push({
      key: "year",
      label: `Released ${describeYears(filters.year)}`,
      onDelete: filtering.removeYear,
    });
  }
  if (filters.score_min !== null) {
    chips.push({
      key: "score",
      label: `k-mer coverage at least ${filters.score_min}`,
      onDelete: filtering.removeScore,
    });
  }
  return chips;
}

/**
 * How many runs the filter keeps, out of how many matched.
 * @param results - The landed results page.
 * @param summary - The filtered summary state.
 * @returns A sentence, or null while the count is not known yet.
 */
function describeMatched(
  results: KmindexResults,
  summary: KmindexSummaryState
): string | null {
  const total = results.total_matches ?? results.total_hits;
  let matched: number | null = summary.summary?.matched ?? null;
  if (matched === null && results.filtered)
    matched = results.filtered_matches ?? results.total_hits;
  if (matched === null) return null;
  return `${matched.toLocaleString()} of ${total.toLocaleString()} runs match these filters.`;
}

/**
 * The active filters over a Logan search, between the summary strip and the
 * table: what is picked, how much it keeps, and the ways to undo it or take
 * it away.
 * @param props - Component props.
 * @param props.disabledReason - Why filtering cannot run, or null.
 * @param props.filterError - Why the filtered table was refused, if it was.
 * @param props.filtering - The filter hook.
 * @param props.results - The landed results page.
 * @param props.summary - The filtered summary state.
 * @returns The bar.
 */
export const LoganSearchFilterBar = ({
  disabledReason,
  filterError,
  filtering,
  results,
  summary,
}: LoganSearchFilterBarProps): JSX.Element | null => {
  const [copied, setCopied] = useState<keyof typeof COPY_LABELS>("idle");
  const resetTimer = useRef<number | undefined>(undefined);

  useEffect(() => (): void => window.clearTimeout(resetTimer.current), []);
  const { filters, query } = filtering;

  if (isEmptyFilters(filters)) {
    return (
      <Typography
        color="textSecondary"
        component="div"
        sx={{ mt: 2 }}
        variant="body2"
      >
        {disabledReason ??
          "Filter by clicking a value or a year in the breakdown below, or a country on the map. The table, the breakdown and a download all follow, over every matched run."}
      </Typography>
    );
  }

  const isoNames = Object.fromEntries(
    [
      ...(results.geography?.countries ?? []),
      ...(summary.summary?.geography?.countries ?? []),
    ].map((country) => [country.iso_a3, country.value])
  );
  const chips = filterChips(filtering, isoNames);
  const matched = describeMatched(results, summary);
  const problem = filterError ?? summary.error ?? disabledReason;

  const copyWhere = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(toDuckdbWhere(filters, isoNames));
      setCopied("copied");
    } catch {
      setCopied("failed");
    }
    window.clearTimeout(resetTimer.current);
    resetTimer.current = window.setTimeout(() => setCopied("idle"), 2000);
  };

  return (
    <Card sx={{ mt: 2 }}>
      <CardContent>
        <Typography component="h2" variant="subtitle1">
          {matched ?? "Counting the runs that match these filters."}
        </Typography>
        {problem && (
          <Alert severity="warning" sx={{ mt: 1 }}>
            {problem} Clear the filters to see every matched run.
          </Alert>
        )}
        <FilterChips>
          {chips.map((chip) => (
            <Chip
              key={chip.key}
              label={chip.label}
              onDelete={chip.onDelete}
              size="small"
            />
          ))}
          <Button onClick={filtering.clear} size="small">
            Clear filters
          </Button>
          <Button onClick={copyWhere} size="small">
            {COPY_LABELS[copied]}
          </Button>
          {!problem && results.export_status === "available" && (
            <Button
              component="a"
              download
              href={`${API_BASE_URL}/galaxy/kmindex/jobs/${results.job_id}/export?format=tsv&${query}`}
              size="small"
              startIcon={<Download />}
              variant="outlined"
            >
              Download filtered runs (TSV)
            </Button>
          )}
        </FilterChips>
      </CardContent>
    </Card>
  );
};
