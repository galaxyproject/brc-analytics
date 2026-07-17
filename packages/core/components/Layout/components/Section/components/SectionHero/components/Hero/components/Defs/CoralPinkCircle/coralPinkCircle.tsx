import {
  ANIMATE_MOTION,
  FILL,
  SHAPE_HEIGHT,
} from "@brc-analytics/core/components/Layout/components/Section/components/SectionHero/components/Hero/common/constants";
import { ELEMENT_ID } from "@brc-analytics/core/components/Layout/components/Section/components/SectionHero/components/Hero/common/types";
import {
  calculateCircleXPosition,
  calculateCircleYPosition,
  getAnimateMotionTransformCircle,
} from "@brc-analytics/core/components/Layout/components/Section/components/SectionHero/components/Hero/common/utils";
import { JSX } from "react";
import { Props } from "./types";

export const CoralPinkCircle = ({ gridSize }: Props): JSX.Element => {
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
