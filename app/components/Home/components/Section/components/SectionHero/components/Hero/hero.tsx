import { Fragment } from "react";
import {
  FILL,
  GRID_SIZE,
} from "../../../../../../../Layout/components/Hero/common/constants";
import { ELEMENT_ID } from "../../../../../../../Layout/components/Hero/common/entities";
import {
  getFillUrl,
  getViewBox,
} from "../../../../../../../Layout/components/Hero/common/utils";
import { BlueCircle } from "../../../../../../../Layout/components/Hero/components/Defs/BlueCircle/blueCircle";
import { BlueRect } from "../../../../../../../Layout/components/Hero/components/Defs/BlueRect/blueRect";
import { CoralPinkCircle } from "../../../../../../../Layout/components/Hero/components/Defs/CoralPinkCircle/coralPinkCircle";
import { SmokeCircle } from "../../../../../../../Layout/components/Hero/components/Defs/SmokeCircle/smokeCircle";
import { SmokeRect } from "../../../../../../../Layout/components/Hero/components/Defs/SmokeRect/smokeRect";
import { YellowRect } from "../../../../../../../Layout/components/Hero/components/Defs/YellowRect/yellowRect";
import { SVG } from "./hero.styles";

export interface HeroProps {
  gridSize?: number;
  height?: number;
}

export const Hero = ({
  gridSize = GRID_SIZE,
  height = gridSize * 3,
}: HeroProps): JSX.Element => {
  return (
    <SVG
      fill={FILL.NONE}
      height={height}
      preserveAspectRatio="xMinYMin meet"
      viewBox={getViewBox(gridSize, height)}
      width="100%"
      xmlns="http://www.w3.org/2000/svg"
    >
      <SmokeRect gridSize={gridSize} />
      <SmokeCircle gridSize={gridSize} />
      <BlueRect gridSize={gridSize} />
      <YellowRect gridSize={gridSize} />
      <BlueCircle gridSize={gridSize} />
      <CoralPinkCircle gridSize={gridSize} />
      {[ELEMENT_ID.PATTERN_SMOKE_RECT, ELEMENT_ID.PATTERN_SMOKE_CIRCLE].map(
        (elementId) => (
          <Fragment key={elementId}>
            <rect
              fill={getFillUrl(elementId)}
              height={height}
              width="100%"
              x={0}
              y={0}
            />
          </Fragment>
        )
      )}
    </SVG>
  );
};
