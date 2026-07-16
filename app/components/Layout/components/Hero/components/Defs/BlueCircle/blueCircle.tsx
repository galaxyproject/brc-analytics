import {
  ANIMATE_MOTION,
  FILL,
  SHAPE_HEIGHT,
} from "@brc-analytics/core/components/Layout/components/Hero/common/constants";
import { ELEMENT_ID } from "@brc-analytics/core/components/Layout/components/Hero/common/types";
import {
  calculateCircleXPosition,
  calculateCircleYPosition,
  getAnimateMotionTransformCircle,
} from "@brc-analytics/core/components/Layout/components/Hero/common/utils";
import { JSX } from "react";

export interface BlueCircleProps {
  gridSize: number;
}

export const BlueCircle = ({ gridSize }: BlueCircleProps): JSX.Element => {
  return (
    <defs>
      <g id={ELEMENT_ID.GROUP_BLUE_CIRCLE}>
        <circle
          cx={calculateCircleXPosition(gridSize, 310)}
          cy={calculateCircleYPosition(gridSize, 310)}
          fill={FILL.BLUE}
          r={SHAPE_HEIGHT.BLUE_CIRCLE / 2}
        >
          <animateTransform
            {...ANIMATE_MOTION}
            attributeName="transform"
            from={getAnimateMotionTransformCircle(0, gridSize)}
            to={getAnimateMotionTransformCircle(360, gridSize)}
            type="rotate"
          />
        </circle>
      </g>
    </defs>
  );
};
