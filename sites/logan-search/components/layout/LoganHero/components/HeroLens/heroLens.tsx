import { PRIMARY, SECONDARY } from "@logan/theme/options/palette";
import { type JSX } from "react";
import { LensSvg } from "./heroLens.styles";

interface Read {
  hit?: boolean;
  width: number;
  x: number;
  y: number;
}

// The logo's lens, drawn large over the band's contig field: inside the glass
// the contigs come up magnified, and the one the query matched is amber.
const LENS = { CX: 100, CY: 100, R: 76 };
const BAR = { HEIGHT: 12, RADIUS: 6 };
const MAGNIFIED: Read[] = [
  { width: 70, x: 20, y: 46 },
  { width: 96, x: 100, y: 46 },
  { width: 48, x: 30, y: 70 },
  { hit: true, width: 104, x: 86, y: 70 },
  { width: 120, x: 16, y: 94 },
  { width: 50, x: 144, y: 94 },
  { width: 36, x: 24, y: 118 },
  { width: 88, x: 68, y: 118 },
  { width: 82, x: 40, y: 142 },
  { width: 44, x: 130, y: 142 },
];
const MAGNIFIED_FILL = "#C9B8F0";

// Only one hero renders per page, so a fixed id can't collide.
const CLIP_ID = "logan-hero-lens-glass";

/**
 * The logo's lens, large, sitting over the hero's contig field. Decorative.
 * @returns the lens illustration.
 */
export const HeroLens = (): JSX.Element => {
  return (
    <LensSvg aria-hidden="true" focusable="false" viewBox="0 0 240 240">
      <defs>
        <clipPath id={CLIP_ID}>
          <circle cx={LENS.CX} cy={LENS.CY} r={LENS.R} />
        </clipPath>
      </defs>
      <line
        stroke={PRIMARY.DARK}
        strokeLinecap="round"
        strokeWidth={22}
        x1={158}
        x2={218}
        y1={158}
        y2={218}
      />
      <circle cx={LENS.CX} cy={LENS.CY} fill="#FFFFFF" r={LENS.R} />
      <g clipPath={`url(#${CLIP_ID})`}>
        {MAGNIFIED.map(({ hit, width, x, y }) => (
          <rect
            fill={hit ? SECONDARY.MAIN : MAGNIFIED_FILL}
            height={BAR.HEIGHT}
            key={`${x}-${y}`}
            rx={BAR.RADIUS}
            width={width}
            x={x}
            y={y}
          />
        ))}
      </g>
      <circle
        cx={LENS.CX}
        cy={LENS.CY}
        fill="none"
        r={LENS.R}
        stroke={PRIMARY.MAIN}
        strokeWidth={12}
      />
    </LensSvg>
  );
};
