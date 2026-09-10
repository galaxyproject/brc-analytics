import {
  YearBand,
  YearBar,
  YearColumn,
  YearLabel,
  YearRow,
} from "@brc/components/LoganSearch/loganSearch.styles";
import { Box, Typography } from "@mui/material";
import { visuallyHidden } from "@mui/utils";
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
    // Four digits, not merely numeric: a blank value converts to 0, which as
    // a year would stretch the axis back two millennia.
    if (!/^\d{4}$/.test(value)) continue;
    counted.set(Number(value), count);
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
  const counted = bars.reduce((sum, bar) => sum + bar.count, 0);
  // Label every bar up to a dozen years; past that, every fifth, so the axis
  // stays readable at the widths the card gets.
  const labelEvery = bars.length > 12 ? 5 : 1;
  // Thinning the axis leaves the most recent year unnamed, which is the one a
  // reader looks for first. Label it too, unless it sits close enough to the
  // previous label for the two to collide.
  const labelLast = (bars.length - 1) % labelEvery >= 3;
  const peak = bars.reduce((tallest, bar) =>
    bar.count > tallest.count ? bar : tallest
  );
  // The range alone says nothing about the shape, and the drawing is hidden
  // from a screen reader. Naming the peak gives it the fact the picture leads
  // with; the hidden list below carries the rest.
  const range = `Runs released per year, ${bars[0].year} to ${
    bars[bars.length - 1].year
  }`;
  const label =
    max > 0
      ? `${range}; most in ${peak.year}, with ${peak.count.toLocaleString()}`
      : range;
  return (
    /* The margin lives here rather than on a wrapper in the card, so a facet
       with no years leaves no gap behind it. */
    <Box sx={{ mt: 3 }}>
      <Typography variant="subtitle2">Release year</Typography>
      <Typography color="textSecondary" component="div" variant="caption">
        {counted.toLocaleString()} runs
        {facet.unknown > 0 &&
          `, ${facet.unknown.toLocaleString()} with no release date`}
        {facet.other > 0 &&
          `, ${facet.other.toLocaleString()} in years not listed`}
      </Typography>
      <YearRow aria-label={label} role="img">
        {bars.map((bar, i) => (
          <YearColumn
            key={bar.year}
            title={`${bar.year}: ${bar.count.toLocaleString()} runs`}
          >
            <YearBand>
              <YearBar
                style={{
                  height: `${max > 0 ? Math.round((bar.count / max) * 100) : 0}%`,
                  // A year that rounds to nothing against the tallest still
                  // happened: 81 runs beside 402,118 is under half a pixel,
                  // and the stub is what keeps it on the axis. A year with
                  // nothing in it draws nothing, and the baseline under the
                  // band is what says it was counted.
                  minHeight: bar.count > 0 ? 1 : 0,
                }}
              />
            </YearBand>
            <YearLabel>
              {i % labelEvery === 0 || (labelLast && i === bars.length - 1)
                ? bar.year
                : ""}
            </YearLabel>
          </YearColumn>
        ))}
      </YearRow>
      {/* The per-year counts are otherwise hover-only: role="img" hides the
          columns, and a title attribute is not read out. */}
      <Box component="ul" sx={visuallyHidden}>
        {bars.map((bar) => (
          <li key={bar.year}>
            {bar.year}: {bar.count.toLocaleString()} runs
          </li>
        ))}
      </Box>
    </Box>
  );
};
