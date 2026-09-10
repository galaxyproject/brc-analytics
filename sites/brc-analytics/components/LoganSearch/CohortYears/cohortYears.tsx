import {
  YearBar,
  YearColumn,
  YearLabel,
  YearRow,
} from "@brc/components/LoganSearch/loganSearch.styles";
import { Typography } from "@mui/material";
import { type KmindexFacet } from "@repo/shared/hooks/useKmindexSearch";
import { type JSX } from "react";

interface CohortYearsProps {
  facet: KmindexFacet;
}

interface YearBarDatum {
  count: number;
  year: number;
}

/**
 * Every year from the first to the last, zero-filled, so a gap reads as a
 * gap rather than disappearing.
 * @param facet - The release_year facet.
 * @returns Chronological bars.
 */
export function yearBars(facet: KmindexFacet): YearBarDatum[] {
  const counted = new Map<number, number>();
  for (const { count, value } of facet.values ?? []) {
    const year = Number(value);
    if (Number.isFinite(year)) counted.set(year, count);
  }
  if (counted.size === 0) return [];
  const years = [...counted.keys()];
  const first = Math.min(...years);
  const last = Math.max(...years);
  return Array.from({ length: last - first + 1 }, (_, i) => ({
    count: counted.get(first + i) ?? 0,
    year: first + i,
  }));
}

export const CohortYears = ({
  facet,
}: CohortYearsProps): JSX.Element | null => {
  const bars = yearBars(facet);
  if (bars.length === 0) return null;
  const max = Math.max(...bars.map((bar) => bar.count));
  const listed = bars.reduce((sum, bar) => sum + bar.count, 0);
  // Label every bar up to a dozen years; past that, every fifth, so the axis
  // stays readable at the widths the card gets.
  const labelEvery = bars.length > 12 ? 5 : 1;
  return (
    <div>
      <Typography variant="subtitle2">Release year</Typography>
      <Typography color="textSecondary" component="div" variant="caption">
        {listed.toLocaleString()} runs
        {facet.unknown > 0 &&
          `, ${facet.unknown.toLocaleString()} with no release date`}
        {facet.other > 0 &&
          `, ${facet.other.toLocaleString()} in years not listed`}
      </Typography>
      <YearRow
        aria-label={`Runs released per year, ${bars[0].year} to ${
          bars[bars.length - 1].year
        }`}
        role="img"
      >
        {bars.map((bar, i) => (
          <YearColumn
            key={bar.year}
            title={`${bar.year}: ${bar.count.toLocaleString()} runs`}
          >
            <YearBar
              style={{
                height: `${max > 0 ? Math.round((bar.count / max) * 100) : 0}%`,
              }}
            />
            <YearLabel>{i % labelEvery === 0 ? bar.year : ""}</YearLabel>
          </YearColumn>
        ))}
      </YearRow>
    </div>
  );
};
