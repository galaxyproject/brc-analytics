import {
  FILL,
  GRID_SIZE,
} from "@/components/Layout/components/Hero/common/constants";
import { ELEMENT_ID } from "@/components/Layout/components/Hero/common/entities";
import {
  getFillUrl,
  getViewBox,
} from "@/components/Layout/components/Hero/common/utils";
import { CoralPinkCircle } from "@/components/Layout/components/Hero/components/Defs/CoralPinkCircle/coralPinkCircle";
import { SmokeCircle } from "@/components/Layout/components/Hero/components/Defs/SmokeCircle/smokeCircle";
import { SmokeRect } from "@/components/Layout/components/Hero/components/Defs/SmokeRect/smokeRect";
import { YellowRect } from "@/components/Layout/components/Hero/components/Defs/YellowRect/yellowRect";
import { Fragment, JSX } from "react";
import { SVG } from "./hero.styles";

export interface HeroProps {
  gridSize?: number;
  height?: number;
  width?: number;
}

export const Hero = ({
  gridSize = GRID_SIZE,
  height = gridSize * 1.5,
  width = 0,
}: HeroProps): JSX.Element => {
  return (
    <SVG
      fill={FILL.NONE}
      height={height}
      preserveAspectRatio="xMinYMin meet"
      viewBox={getViewBox(gridSize, height)}
      xmlns="http://www.w3.org/2000/svg"
    >
      <SmokeRect gridSize={gridSize} />
      <SmokeCircle gridSize={gridSize} />
      <YellowRect gridShift={3} gridSize={gridSize} />
      <CoralPinkCircle gridSize={gridSize} />
      {[ELEMENT_ID.PATTERN_SMOKE_RECT, ELEMENT_ID.PATTERN_SMOKE_CIRCLE].map(
        (elementId) => (
          <Fragment key={elementId}>
            <rect
              fill={getFillUrl(elementId)}
              height={height}
              width={width}
              x={0}
              y={0}
            />
          </Fragment>
        )
      )}
    </SVG>
  );
};
