import { JSX } from "react";
import {
  ANIMATE_MOTION,
  FILL,
  SHAPE_HEIGHT,
  SHAPE_WIDTH,
  X_POSITION,
} from "../../../common/constants";
import { ELEMENT_ID, PATTERN_UNIT } from "../../../common/entities";
import {
  getAnimateMotionPathBlueRect,
  getElementHref,
} from "../../../common/utils";

export interface BlueRectProps {
  gridSize: number;
}

export const BlueRect = ({ gridSize }: BlueRectProps): JSX.Element => {
  return (
    <defs>
      <g id={ELEMENT_ID.GROUP_BLUE_RECT}>
        <rect
          fill={FILL.BLUE}
          height={SHAPE_HEIGHT.BLUE_RECT}
          rx="3"
          width={SHAPE_WIDTH.BLUE_RECT}
          x={X_POSITION.BLUE_RECT}
        >
          <animateMotion
            {...ANIMATE_MOTION}
            path={getAnimateMotionPathBlueRect(gridSize)}
          />
        </rect>
      </g>
      <pattern
        height={gridSize * 2}
        id={ELEMENT_ID.PATTERN_BLUE_RECT}
        patternUnits={PATTERN_UNIT.USER_SPACE_ON_USE}
        width={gridSize * 8}
        x={gridSize * 3}
        y={gridSize - SHAPE_HEIGHT.BLUE_RECT / 2}
      >
        <use href={getElementHref(ELEMENT_ID.GROUP_BLUE_RECT)} />
      </pattern>
    </defs>
  );
};
