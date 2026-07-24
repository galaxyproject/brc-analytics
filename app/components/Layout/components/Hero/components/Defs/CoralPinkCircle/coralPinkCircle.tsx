import {
  ANIMATE_MOTION,
  FILL,
  SHAPE_HEIGHT,
} from "@/components/Layout/components/Hero/common/constants";
import { ELEMENT_ID } from "@/components/Layout/components/Hero/common/entities";
import {
  calculateCircleXPosition,
  calculateCircleYPosition,
  getAnimateMotionTransformCircle,
} from "@/components/Layout/components/Hero/common/utils";
import { JSX } from "react";

export interface CoralPinkCircleProps {
  gridSize: number;
}

export const CoralPinkCircle = ({
  gridSize,
}: CoralPinkCircleProps): JSX.Element => {
  return (
    <defs>
      <g id={ELEMENT_ID.GROUP_CORAL_PINK_CIRLCLE}>
        <circle
          cx={gridSize * 4 + calculateCircleXPosition(gridSize, 135)}
          cy={calculateCircleYPosition(gridSize, 135)}
          fill={FILL.CORAL_PINK}
          r={SHAPE_HEIGHT.CORAL_PINK_CIRCLE / 2}
        >
          <animateTransform
            {...ANIMATE_MOTION}
            attributeName="transform"
            from={getAnimateMotionTransformCircle(0, gridSize, 4)}
            to={getAnimateMotionTransformCircle(360, gridSize, 4)}
            type="rotate"
          />
        </circle>
      </g>
    </defs>
  );
};
