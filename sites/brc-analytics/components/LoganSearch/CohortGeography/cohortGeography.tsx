"use client";

import { CohortMapContainer } from "@brc/components/LoganSearch/loganSearch.styles";
import { formatShare } from "@brc/components/LoganSearch/utils";
import { Box, Typography } from "@mui/material";
import {
  type KmindexGeography,
  type KmindexGeographyCountry,
} from "@repo/shared/hooks/useKmindexSearch";
import { type JSX, useEffect, useRef, useState } from "react";
import type { TopLevelSpec } from "vega-lite";

interface CohortGeographyProps {
  // Nullable on purpose. Absent means the backend could not answer -- an
  // unconfigured mirror, or one that predates the columns the geography query
  // needs and closed that capability on its own. That is a statement about
  // our deployment, not about the cohort, so it renders as nothing rather
  // than as "no geography recorded".
  geography?: KmindexGeography | null;
}

// Committed under sites/brc-analytics/public, so it is same-origin and there
// is no CDN on the render path. basePath is "" for this site, so the served
// path is the public path.
const BOUNDARIES_URL = "/geo/countries-110m.json";

// The world outline is a fixed 107 KB and the projection is fitted to the
// container, so height is a layout decision rather than a data one.
const MAP_HEIGHT = 320;

// Countries with no matched runs, which is most of the world on most
// cohorts. Painted rather than left unfilled so "none" and "few" cannot be
// confused, and so the map still reads as a world map for a cohort that
// matched three countries.
const NO_DATA_FILL = "#eceff1";
const BORDER_STROKE = "#ffffff";

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
 * What is counted but not coloured, and why.
 *
 * Two causes, deliberately given one sentence rather than two: the recorded
 * value is not a country, or it is a country the 1:110m outline has no shape
 * of its own for. Neither changes what the reader should do about it, and
 * both are the same failure if left unsaid -- runs vanishing off the map with
 * nothing on screen admitting it.
 *
 * "of its own" is doing real work and is not hedging. Several of these
 * territories are drawn, just inside somebody else's feature: probing the
 * committed asset, Cayenne falls inside France's polygon, Longyearbyen inside
 * Norway's, Hong Kong inside China's and Singapore inside Malaysia's. Those
 * four alone are 168,340 of the 250,989 unplaceable runs mirror-wide. Saying
 * "the outline has no shape for them" in front of a map that visibly draws
 * their territory -- coloured with the parent's count, not theirs -- is the
 * kind of small false note that makes a reader stop trusting the rest.
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
  const places =
    unplaceable.length === 1
      ? "one place"
      : `${unplaceable.length.toLocaleString()} places`;
  return (
    `${runs.toLocaleString()} of those runs come from ${places} the map ` +
    `cannot colour -- the world outline has no shape of its own for them at ` +
    `this scale, or the recorded value is not a country. They are counted ` +
    `here but not on the map: ${named}${tail}.`
  );
}

/**
 * The choropleth spec.
 *
 * Two layers over one copy of the geometry, and the reason is not cosmetic.
 * A single layer with a quantitative colour encoding compiles to a vega
 * `filter` on `isValid(datum.count)`, which drops every feature the lookup
 * did not match -- i.e. most of the world -- and leaves the matched countries
 * floating on an empty background with no outline behind them. So the base
 * layer draws all 177 features flat and the second draws only the matched
 * ones on top of it.
 *
 * The join is the part worth reading twice. world-110m keys its features by
 * ISO *numeric* id, so the lookup is `id` against `iso_n3` -- joining on the
 * alpha-3 code next to it matches nothing and draws a blank world without
 * erroring. The backend only emits countries whose numeric id is in the
 * committed asset; everything else it counted is in `unmapped_countries` and
 * is reported in prose above.
 *
 * Colour is log-scaled because the distribution is not remotely linear: the
 * USA carries 9.2M runs mirror-wide against a few hundred for Malawi, and on
 * a linear ramp every country but two or three renders as the same pale blue.
 * @param countries - Drawable countries with their run counts.
 * @returns A Vega-Lite spec.
 */
function buildSpec(countries: KmindexGeographyCountry[]): TopLevelSpec {
  return {
    $schema: "https://vega.github.io/schema/vega-lite/v6.json",
    autosize: { contains: "padding", resize: true, type: "fit-x" },
    background: "transparent",
    // Declared once at the top so both layers share a single fetch.
    data: {
      format: { feature: "countries", type: "topojson" },
      url: BOUNDARIES_URL,
    },
    height: MAP_HEIGHT,
    layer: [
      // Every country, flat. Without this the map is only the countries that
      // matched, which reads as a world that stops at the data.
      {
        mark: {
          fill: NO_DATA_FILL,
          stroke: BORDER_STROKE,
          strokeWidth: 0.4,
          type: "geoshape",
        },
      },
      {
        encoding: {
          color: {
            field: "count",
            legend: { format: ",", title: "Matched runs" },
            scale: { domainMin: 1, scheme: "blues", type: "log" },
            type: "quantitative",
          },
          tooltip: [
            { field: "value", title: "Country", type: "nominal" },
            {
              field: "count",
              format: ",",
              title: "Matched runs",
              type: "quantitative",
            },
          ],
        },
        mark: { stroke: BORDER_STROKE, strokeWidth: 0.4, type: "geoshape" },
        transform: [
          {
            from: {
              data: { values: countries },
              fields: ["count", "value"],
              key: "iso_n3",
            },
            lookup: "id",
          },
        ],
      },
    ],
    // Equal-area: a choropleth compares magnitudes between countries, and
    // Mercator would inflate the high-latitude ones several-fold while doing
    // it.
    projection: { type: "equalEarth" },
    width: "container",
  };
}

/**
 * The choropleth itself.
 *
 * Follows the embedding pattern in packages/shared/components/mdx/VegaEmbed:
 * "use client", a container ref, embed() in an effect, and finalize() in the
 * cleanup, which vega-embed leaks without.
 *
 * vega is imported dynamically rather than at module scope, and the reason is
 * measured. Production build of sites/brc-analytics, before and after this
 * whole feature: /logan-search first-load JS goes from 1,266.4 kB to
 * 1,271.6 kB, +5.2 kB, of which 3.6 kB is the page chunk and the rest is
 * _app. vega and vega-lite are 727.8 kB across two chunks and neither is in
 * that first load -- they are fetched when this component mounts. A static
 * import would have put all of it on every visit to the page, and most
 * visitors never scroll this far. That is also why there is no next/dynamic
 * here: a plain dynamic import already splits the chunk, so the repo does not
 * need its first one for this.
 * @param props - Component props.
 * @param props.countries - Drawable countries with their run counts.
 * @returns The map, or a note in place of it if the render failed.
 */
function GeographyMap({
  countries,
}: {
  countries: KmindexGeographyCountry[];
}): JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let result: { finalize: () => void } | null = null;
    let cancelled = false;

    const draw = async (): Promise<void> => {
      if (!containerRef.current) return;
      try {
        const { default: embed } = await import("vega-embed");
        if (cancelled || !containerRef.current) return;
        const embedded = await embed(
          containerRef.current,
          buildSpec(countries),
          {
            actions: false,
            renderer: "svg",
          }
        );
        // The effect can be torn down while embed() is in flight, and
        // vega-embed leaks its view unless finalize() runs.
        if (cancelled) {
          embedded.finalize();
          return;
        }
        result = embedded;
        setFailed(false);
      } catch (error) {
        // A map that fails to draw must say so. A blank box in the space
        // where a world was promised reads as "nothing matched anywhere",
        // which is a claim about the data rather than about the render.
        console.error("Failed to render the cohort map:", error);
        setFailed(true);
      }
    };

    draw();

    return (): void => {
      cancelled = true;
      if (result) result.finalize();
    };
  }, [countries]);

  if (failed) {
    return (
      <Typography color="textSecondary" variant="body2">
        The map could not be drawn. The counts beside it are unaffected.
      </Typography>
    );
  }
  return <CohortMapContainer ref={containerRef} />;
}

/**
 * Where a cohort's runs were sampled from.
 * @param props - Component props.
 * @param props.geography - Geography rollup over the whole match set.
 * @returns The geography block.
 */
export const CohortGeography = ({
  geography,
}: CohortGeographyProps): JSX.Element | null => {
  // Same posture as LoganSearchCohort on an absent cohort: say nothing rather
  // than render a shell. A world map with no countries coloured is not an
  // empty state, it is an assertion that the query matched nowhere.
  if (!geography) return null;

  const countries = geography.countries ?? [];
  const unplaceable = describeUnplaceable(geography);
  return (
    <div>
      <Typography variant="subtitle2">Where these runs came from</Typography>
      <Typography color="textSecondary" component="div" variant="caption">
        {describeCoverage(geography)}
      </Typography>
      {countries.length > 0 ? (
        <GeographyMap countries={countries} />
      ) : (
        // Nothing to draw, for one of two reasons: no run in the cohort has a
        // country at all, or every country it does have is one the outline
        // cannot place. Either way the map is replaced by a sentence rather
        // than left as an empty world, which would read as a finding.
        <Box
          sx={{
            alignItems: "center",
            border: 1,
            borderColor: "divider",
            borderRadius: 1,
            borderStyle: "dashed",
            display: "flex",
            justifyContent: "center",
            minHeight: 160,
            mt: 1,
            p: 2,
            textAlign: "center",
          }}
        >
          <Typography color="textSecondary" variant="body2">
            {geography.recorded === 0
              ? "No map: not one matched run has a country recorded."
              : "No map: none of the recorded countries can be placed on it."}
          </Typography>
        </Box>
      )}
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
