import { JSX } from "react";
import { FILL } from "../../../common/constants";
import { ELEMENT_ID, PATTERN_UNIT } from "../../../common/entities";
import { getElementHref } from "../../../common/utils";

export interface SmokeRectProps {
  gridSize: number;
}

export const SmokeRect = ({ gridSize }: SmokeRectProps): JSX.Element => {
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
