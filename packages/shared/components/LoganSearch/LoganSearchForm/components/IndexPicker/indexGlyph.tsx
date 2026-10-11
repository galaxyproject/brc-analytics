import { PALETTE } from "@databiosphere/findable-ui/lib/styles/common/constants/palette";
import {
  axisOptions,
  indexDivision,
  indexStrategy,
} from "@repo/shared/components/LoganSearch/utils";
import { type JSX, useMemo } from "react";

// One square per index, laid out like the matrix: organism groups down,
// library types across.
const SQUARE = 5;
const STEP = 6.5;

interface IndexGlyphProps {
  indexes: string[];
  selected: string[];
}

/**
 * A thumbnail of the matrix: what a scope covers, at a glance. Decorative --
 * the card's text says the same thing in words.
 * @param props - Component props.
 * @param props.indexes - Every registered index name.
 * @param props.selected - The index names this glyph shows as included.
 * @returns The glyph.
 */
export const IndexGlyph = ({
  indexes,
  selected,
}: IndexGlyphProps): JSX.Element => {
  const { divisions, registered, strategies } = useMemo(
    () => ({
      divisions: axisOptions(indexes, "division").map(({ code }) => code),
      registered: new Set(indexes),
      strategies: axisOptions(indexes, "strategy").map(({ code }) => code),
    }),
    [indexes]
  );
  const included = new Set(selected);
  const width = strategies.length * STEP - (STEP - SQUARE);
  const height = divisions.length * STEP - (STEP - SQUARE);
  return (
    <svg
      aria-hidden="true"
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      width={width}
    >
      {[...registered].map((index) => {
        const row = divisions.indexOf(indexDivision(index));
        const col = strategies.indexOf(indexStrategy(index));
        return (
          <rect
            height={SQUARE}
            key={index}
            rx={1.2}
            style={{
              fill: included.has(index)
                ? PALETTE.PRIMARY_MAIN
                : PALETTE.SMOKE_MAIN,
            }}
            width={SQUARE}
            x={col * STEP}
            y={row * STEP}
          />
        );
      })}
    </svg>
  );
};
