import { JSX } from "react";
import { FILL } from "../../../common/constants";
import { ELEMENT_ID, PATTERN_UNIT } from "../../../common/entities";
import { getElementHref } from "../../../common/utils";

export interface SmokeCircleProps {
  gridSize: number;
}

export const SmokeCircle = ({ gridSize }: SmokeCircleProps): JSX.Element => {
  return (
    <defs>
      <g id={ELEMENT_ID.GROUP_SMOKE_CIRCLE} opacity="0.5">
        <circle
          cx={gridSize / 2}
          cy={gridSize / 2}
          r={gridSize / 2}
          stroke={FILL.SMOKE}
        />
        <circle
          cx={gridSize / 2 + gridSize * 4}
          cy={gridSize / 2}
          r={gridSize / 2}
          stroke={FILL.SMOKE}
        />
        <circle
          cx={gridSize / 2 + gridSize * 6}
          cy={gridSize / 2}
          r={gridSize / 2}
          stroke={FILL.SMOKE}
        />
      </g>
      <pattern
        height={gridSize * 2}
        id={ELEMENT_ID.PATTERN_SMOKE_CIRCLE}
        patternUnits={PATTERN_UNIT.USER_SPACE_ON_USE}
        width={gridSize * 8}
      >
        <use href={getElementHref(ELEMENT_ID.GROUP_SMOKE_CIRCLE)} />
        <use
          href={getElementHref(ELEMENT_ID.GROUP_SMOKE_CIRCLE)}
          transform={`translate(${gridSize}, ${gridSize})`}
        />
      </pattern>
    </defs>
  );
};
