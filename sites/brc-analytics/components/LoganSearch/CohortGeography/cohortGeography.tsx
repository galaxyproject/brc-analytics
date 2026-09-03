"use client";

import { formatShare } from "@brc/components/LoganSearch/utils";
import { Typography } from "@mui/material";
import { type KmindexGeography } from "@repo/shared/hooks/useKmindexSearch";
import { type JSX } from "react";

interface CohortGeographyProps {
  geography: KmindexGeography;
}

// How many unplaceable countries to name before the rest become a count.
// Three fits on one line at the width this block gets and is enough to make
// the point that the omissions are real places.
const UNPLACEABLE_NAMED = 3;

/**
 * Sum a list of counts.
 * @param counts - Counts to add.
 * @returns Their total.
 */
function sum(counts: number[]): number {
  return counts.reduce((running, count) => running + count, 0);
}

/**
 * How much of the cohort has any recorded geography at all.
 *
 * This is the most important string on the card and it is built before
 * anything is drawn, deliberately. A map that colours 42 countries for a
 * cohort where four fifths of the runs have no country recorded tells the
 * reader something false about their data, and it does it confidently. The
 * denominator is not a footnote to the map; it is the reason the map is
 * allowed to exist.
 * @param geography - Geography rollup over the whole match set.
 * @returns A sentence stating both halves of the split.
 */
function describeCoverage(geography: KmindexGeography): string {
  const { in_mirror: inMirror, recorded, unknown } = geography;
  if (recorded === 0) {
    return (
      `No country is recorded for any of the ${inMirror.toLocaleString()} ` +
      `matched runs the mirror knows.`
    );
  }
  const share = formatShare(recorded, inMirror);
  if (unknown === 0) {
    return (
      `Geography recorded for all ${recorded.toLocaleString()} matched runs ` +
      `the mirror knows.`
    );
  }
  return (
    `Geography recorded for ${recorded.toLocaleString()} of ` +
    `${inMirror.toLocaleString()} runs (${share}). The other ` +
    `${unknown.toLocaleString()} matched the query with no country recorded, ` +
    `so nothing on the map speaks for them.`
  );
}

/**
 * What is counted but cannot be drawn, and why.
 *
 * Two causes, deliberately given one sentence rather than two: the recorded
 * value is not a country, or it is a country the 1:110m outline has no shape
 * for. Neither changes what the reader should do about it, and both are the
 * same failure if left unsaid -- runs vanishing off the map with nothing on
 * screen admitting it.
 * @param geography - Geography rollup over the whole match set.
 * @returns A sentence, or null when everything recorded could be placed.
 */
function describeUnplaceable(geography: KmindexGeography): string | null {
  const unplaceable = geography.unmapped_countries ?? [];
  if (unplaceable.length === 0) return null;
  const runs = sum(unplaceable.map(({ count }) => count));
  const named = unplaceable
    .slice(0, UNPLACEABLE_NAMED)
    .map(({ count, value }) => `${value} (${count.toLocaleString()})`)
    .join(", ");
  const rest = unplaceable.length - UNPLACEABLE_NAMED;
  const tail = rest > 0 ? `, and ${rest.toLocaleString()} more` : "";
  return (
    `${runs.toLocaleString()} of those runs come from ` +
    `${unplaceable.length.toLocaleString()} places the map cannot draw -- the ` +
    `world outline has no shape for them at this scale, or the recorded value ` +
    `is not a country. They are counted here but not coloured: ${named}${tail}.`
  );
}

/**
 * Where a cohort's runs were sampled from.
 * @param props - Component props.
 * @param props.geography - Geography rollup over the whole match set.
 * @returns The geography block.
 */
export const CohortGeography = ({
  geography,
}: CohortGeographyProps): JSX.Element => {
  const unplaceable = describeUnplaceable(geography);
  return (
    <div>
      <Typography variant="subtitle2">Where these runs came from</Typography>
      <Typography color="textSecondary" component="div" variant="caption">
        {describeCoverage(geography)}
      </Typography>
      {unplaceable && (
        <Typography
          color="textSecondary"
          component="div"
          sx={{ mt: 0.5 }}
          variant="caption"
        >
          {unplaceable}
        </Typography>
      )}
    </div>
  );
};
