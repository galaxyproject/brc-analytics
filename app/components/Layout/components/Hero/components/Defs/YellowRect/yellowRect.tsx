import { JSX } from "react";
import {
  ANIMATE_MOTION,
  FILL,
  SHAPE_HEIGHT,
  SHAPE_WIDTH,
  Y_POSITION,
} from "../../../common/constants";
import { ELEMENT_ID, PATTERN_UNIT } from "../../../common/entities";
import {
  getAnimateMotionPathYellowRect,
  getElementHref,
} from "../../../common/utils";

export interface YellowRectProps {
  gridShift?: number;
  gridSize: number;
}

export const YellowRect = ({
  gridShift = 2,
  gridSize,
}: YellowRectProps): JSX.Element => {
  return (
    <defs>
      <g id={ELEMENT_ID.GROUP_YELLOW_RECT}>
        <rect
          fill={FILL.YELLOW}
          height={SHAPE_HEIGHT.YELLOW_RECT}
          rx="3"
          width={SHAPE_WIDTH.YELLOW_RECT}
          y={Y_POSITION.YELLOW_RECT}
        >
          <animateMotion
            {...ANIMATE_MOTION}
            path={getAnimateMotionPathYellowRect(gridSize)}
          />
        </rect>
      </g>
      <pattern
        height={gridSize * 2}
        id={ELEMENT_ID.PATTERN_YELLOW_RECT}
        patternUnits={PATTERN_UNIT.USER_SPACE_ON_USE}
        width={gridSize * 8}
        x={gridSize * gridShift - SHAPE_WIDTH.YELLOW_RECT / 2}
        y={0}
      >
        <use href={getElementHref(ELEMENT_ID.GROUP_YELLOW_RECT)} />
      </pattern>
    </defs>
  );
};
