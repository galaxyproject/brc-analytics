"use client";

import { CohortMapContainer } from "@brc/components/LoganSearch/loganSearch.styles";
import { formatShare } from "@brc/components/LoganSearch/utils";
import { Box, Typography } from "@mui/material";
import {
  type KmindexGeography,
  type KmindexGeographyCountry,
  type KmindexGeographyLocation,
} from "@repo/shared/hooks/useKmindexSearch";
import { type JSX, useEffect, useMemo, useRef, useState } from "react";
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

// Sampling points sit on top of the choropleth, so they need to read as a
// different thing rather than as a darker country. Plasma against blues does
// that, and both ramps stay legible next to each other.
const POINT_SCHEME = "plasma" as const;
const POINT_STROKE = "#37474f";
const POINT_OPACITY = 0.72;

// Area in px^2, not radius. The distribution is brutally skewed -- a single
// institutional coordinate can carry tens of thousands of runs against one
// run at a real station -- so the scale is sqrt: area grows with the square
// root of the count, which keeps the small stations visible at all. It does
// overstate them relative to a strictly proportional encoding; the tooltip
// carries the number for anyone who needs it exactly.
const POINT_SIZE_RANGE = [14, 420];

// How coarse each rounding step actually is, in words, because "2 decimal
// places" is not a distance to anyone reading a map.
const PRECISION_DISTANCE: Record<number, string> = {
  1: "about 11 km",
  2: "about 1.1 km",
  3: "about 110 m",
};

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

// A point as the spec sees it: the payload's numbers plus the one string the
// tooltip shows. Built here rather than with a vega `calculate` transform so
// the hemisphere wording and the rounding are testable without a renderer.
interface PlottedLocation extends KmindexGeographyLocation {
  position: string;
}

/**
 * One point's coordinate, written the way a reader would say it.
 *
 * Rendered at the precision the payload was actually collapsed to, not at
 * whatever the double happens to print. Claiming six decimals for a point the
 * backend merged at three would be a small lie about resolution in the one
 * place a reader goes looking for it.
 * @param location - The aggregated point.
 * @param precision - Decimal places the payload was rounded to, or null.
 * @returns e.g. "16.041° S, 34.798° E".
 */
function formatPosition(
  location: KmindexGeographyLocation,
  precision: number | null
): string {
  const show = (value: number): string =>
    precision === null
      ? String(Math.abs(value))
      : Math.abs(value).toFixed(precision);
  return (
    `${show(location.lat)}° ${location.lat < 0 ? "S" : "N"}, ` +
    `${show(location.lon)}° ${location.lon < 0 ? "W" : "E"}`
  );
}

/**
 * How much of the cohort has a sampling position, and what had to be given up
 * to draw it.
 *
 * Three separate admissions and they are not interchangeable. The first is
 * the denominator, same rule as the country line. The second is rounding,
 * which merges points and keeps every run -- it costs resolution, nothing
 * else. The third is the cap, which drops runs outright. A card that showed
 * 20,000 of 148,766 places without saying so would be telling exactly the
 * kind of lie this whole block exists to stop.
 * @param geography - Geography rollup over the whole match set.
 * @returns A sentence, or null when there is nothing to say about positions.
 */
function describeLocations(geography: KmindexGeography): string | null {
  const {
    in_mirror: inMirror,
    located,
    locations,
    locations_precision: precision,
    locations_total: total,
    locations_truncated: truncated,
  } = geography;
  // Null means the mirror on this host has no coordinate columns. That is a
  // statement about our deployment, not about the cohort, and the country map
  // above it is unaffected -- so it says nothing rather than something false.
  if (!locations || located == null) return null;
  if (located === 0) {
    return (
      `No matched run records a sampling position, so the map shows ` +
      `countries only.`
    );
  }

  const places = total ?? locations.length;
  const parts = [
    `Sampling positions recorded for ${located.toLocaleString()} of ` +
      `${inMirror.toLocaleString()} runs (${formatShare(located, inMirror)}) ` +
      `at ${places.toLocaleString()} ${places === 1 ? "place" : "places"}.`,
  ];
  if (precision != null) {
    parts.push(
      `Coordinates are rounded to ${precision} decimal ` +
        `${precision === 1 ? "place" : "places"} ` +
        `(${PRECISION_DISTANCE[precision] ?? "coarser than recorded"}) so the ` +
        `set fits; every run is still counted.`
    );
  }
  if (truncated) {
    const drawn = locations.length;
    parts.push(
      `Only the ${drawn.toLocaleString()} busiest are drawn -- ` +
        `${truncated.toLocaleString()} runs at the other ` +
        `${(places - drawn).toLocaleString()} are counted here and shown ` +
        `nowhere on the map.`
    );
  }
  return parts.join(" ");
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
 *
 * The point layer on top is kmviz's HitsPerLocation encoding -- size by runs,
 * colour by mean score -- computed over the whole match set rather than one
 * mark per result row. It is drawn last so a station is never hidden under
 * the country it sits in.
 * @param countries - Drawable countries with their run counts.
 * @param points - Aggregated sampling positions, already labelled for hover.
 * @returns A Vega-Lite spec.
 */
function buildSpec(
  countries: KmindexGeographyCountry[],
  points: PlottedLocation[]
): TopLevelSpec {
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
      // Sampling positions. Omitted entirely rather than drawn empty when
      // there are none: a layer with no marks still puts a size and a colour
      // legend on the chart, which would advertise an encoding that describes
      // nothing.
      ...(points.length
        ? [
            {
              data: { values: points },
              encoding: {
                color: {
                  field: "avg_score",
                  legend: { format: ".2f", title: "Mean score" },
                  scale: { scheme: POINT_SCHEME },
                  type: "quantitative" as const,
                },
                latitude: { field: "lat", type: "quantitative" as const },
                longitude: { field: "lon", type: "quantitative" as const },
                size: {
                  field: "n",
                  legend: { format: ",", title: "Matched runs" },
                  scale: { range: POINT_SIZE_RANGE, type: "sqrt" as const },
                  type: "quantitative" as const,
                },
                tooltip: [
                  {
                    field: "position",
                    title: "Position",
                    type: "nominal" as const,
                  },
                  {
                    field: "n",
                    format: ",",
                    title: "Matched runs",
                    type: "quantitative" as const,
                  },
                  {
                    field: "avg_score",
                    format: ".3f",
                    title: "Mean score",
                    type: "quantitative" as const,
                  },
                ],
              },
              mark: {
                opacity: POINT_OPACITY,
                stroke: POINT_STROKE,
                strokeWidth: 0.3,
                type: "circle" as const,
              },
            },
          ]
        : []),
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
 * @param props.points - Aggregated sampling positions, labelled for hover.
 * @returns The map, or a note in place of it if the render failed.
 */
function GeographyMap({
  countries,
  points,
}: {
  countries: KmindexGeographyCountry[];
  points: PlottedLocation[];
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
          buildSpec(countries, points),
          {
            actions: false,
            // vega-embed takes one renderer for the whole view, and the point
            // layer decides it. The cap allows 20,000 circles, and 20,000 SVG
            // nodes is exactly the 31-36 second paint kmviz pays at this
            // scale; canvas draws them in one pass. With no points the world
            // is 177 shapes and SVG keeps their edges crisp.
            renderer: points.length ? "canvas" : "svg",
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
  }, [countries, points]);

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
  const locations = geography?.locations ?? null;
  const precision = geography?.locations_precision ?? null;
  // Memoized because it is an effect dependency: a fresh array on every
  // render would tear down and re-embed the whole view each time anything
  // above this card re-rendered, which at 20,000 points is not free. Above
  // the early return below, because a hook cannot be called conditionally.
  const points = useMemo(
    () =>
      (locations ?? []).map((location) => ({
        ...location,
        position: formatPosition(location, precision),
      })),
    [locations, precision]
  );

  // Same posture as LoganSearchCohort on an absent cohort: say nothing rather
  // than render a shell. A world map with no countries coloured is not an
  // empty state, it is an assertion that the query matched nowhere.
  if (!geography) return null;

  const countries = geography.countries ?? [];
  const unplaceable = describeUnplaceable(geography);
  const positions = describeLocations(geography);
  return (
    <div>
      <Typography variant="subtitle2">Where these runs came from</Typography>
      <Typography color="textSecondary" component="div" variant="caption">
        {describeCoverage(geography)}
      </Typography>
      {positions && (
        <Typography color="textSecondary" component="div" variant="caption">
          {positions}
        </Typography>
      )}
      {countries.length > 0 || points.length > 0 ? (
        <GeographyMap countries={countries} points={points} />
      ) : (
        // Nothing to draw at all: no country the outline can place, and no
        // sampling position either. One point is enough to earn a map, so
        // this is reached only when both are empty. The map is replaced by a
        // sentence rather than left as an empty world, which would read as a
        // finding about the cohort.
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
      {points.length > 0 && (
        <Typography
          color="textSecondary"
          component="div"
          sx={{ mt: 0.5 }}
          variant="caption"
        >
          Each point is every matched run recorded at that coordinate, not one
          run, so hovering names a place rather than an accession. A handful of
          the busiest are institutional addresses typed into the sample
          attribute rather than sampling sites -- a point carrying tens of
          thousands of runs across many organisms is usually one of those.
        </Typography>
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
