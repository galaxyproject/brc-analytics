import { PRIMARY, SECONDARY } from "@logan/theme/options/palette";
import { type JSX } from "react";
import { MotifSvg } from "./contigMotif.styles";

interface Contig {
  accent?: boolean;
  width: number;
  x: number;
  y: number;
}

// One tile of the pattern: rows of contigs of uneven length, the way a run's
// assembly looks once it's laid end to end. Two in the tile are amber so the
// field isn't a flat wash of one colour.
const TILE = { HEIGHT: 120, WIDTH: 360 };
const BAR = { HEIGHT: 4, RADIUS: 2 };
const CONTIGS: Contig[] = [
  { width: 59, x: 23, y: 4 },
  { width: 142, x: 120, y: 4 },
  { width: 133, x: 34, y: 16 },
  { width: 143, x: 182, y: 16 },
  { width: 31, x: 39, y: 28 },
  { width: 27, x: 100, y: 28 },
  { accent: true, width: 104, x: 142, y: 28 },
  { width: 31, x: 29, y: 40 },
  { width: 83, x: 101, y: 40 },
  { width: 131, x: 205, y: 40 },
  { width: 27, x: 5, y: 52 },
  { width: 112, x: 78, y: 52 },
  { width: 113, x: 33, y: 64 },
  { width: 64, x: 159, y: 64 },
  { width: 103, x: 242, y: 64 },
  { width: 118, x: 11, y: 76 },
  { width: 128, x: 156, y: 76 },
  { width: 92, x: 18, y: 88 },
  { width: 59, x: 141, y: 88 },
  { accent: true, width: 96, x: 252, y: 88 },
  { width: 94, x: 28, y: 100 },
  { width: 92, x: 153, y: 100 },
  { width: 34, x: 268, y: 100 },
  { width: 59, x: 18, y: 112 },
  { width: 33, x: 110, y: 112 },
  { width: 48, x: 192, y: 112 },
];

// Only one hero renders per page, so a fixed id can't collide.
const PATTERN_ID = "logan-hero-contigs";

/**
 * A faint field of tiled contig bars behind the hero text. Static: there is
 * nothing to animate, so there is nothing for prefers-reduced-motion to turn
 * off.
 * @returns the decorative background.
 */
export const ContigMotif = (): JSX.Element => {
  return (
    <MotifSvg aria-hidden="true" focusable="false">
      <defs>
        <pattern
          height={TILE.HEIGHT}
          id={PATTERN_ID}
          patternUnits="userSpaceOnUse"
          width={TILE.WIDTH}
        >
          {CONTIGS.map(({ accent, width, x, y }) => (
            <rect
              fill={accent ? SECONDARY.MAIN : PRIMARY.MAIN}
              fillOpacity={accent ? 0.5 : 0.16}
              height={BAR.HEIGHT}
              key={`${x}-${y}`}
              rx={BAR.RADIUS}
              width={width}
              x={x}
              y={y}
            />
          ))}
        </pattern>
      </defs>
      <rect fill={`url(#${PATTERN_ID})`} height="100%" width="100%" />
    </MotifSvg>
  );
};
