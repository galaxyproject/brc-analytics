import { FILL } from "@brc-analytics/core/components/Layout/components/Section/components/SectionHero/components/Hero/common/constants";
import {
  ELEMENT_ID,
  PATTERN_UNIT,
} from "@brc-analytics/core/components/Layout/components/Section/components/SectionHero/components/Hero/common/types";
import { getElementHref } from "@brc-analytics/core/components/Layout/components/Section/components/SectionHero/components/Hero/common/utils";
import { JSX } from "react";
import { Props } from "./types";

export const SmokeRect = ({ gridSize }: Props): JSX.Element => {
  return (
    <defs>
      <g id={ELEMENT_ID.GROUP_SMOKE_RECT} opacity="0.5">
        <rect
          fill={FILL.NONE}
          height={gridSize}
          stroke={FILL.SMOKE}
          width={gridSize}
          x={0}
          y={0}
        />
      </g>
      <pattern
        height={gridSize}
        id={ELEMENT_ID.PATTERN_SMOKE_RECT}
        patternUnits={PATTERN_UNIT.USER_SPACE_ON_USE}
        width={gridSize}
      >
        <use href={getElementHref(ELEMENT_ID.GROUP_SMOKE_RECT)} />
      </pattern>
    </defs>
  );
};
