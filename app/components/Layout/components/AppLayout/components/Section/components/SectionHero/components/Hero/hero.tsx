import { Fragment } from "react";
import { FILL, GRID_SIZE } from "../../../../../../../Hero/common/constants";
import { ELEMENT_ID } from "../../../../../../../Hero/common/entities";
import { getFillUrl, getViewBox } from "../../../../../../../Hero/common/utils";
import { CoralPinkCircle } from "../../../../../../../Hero/components/Defs/CoralPinkCircle/coralPinkCircle";
import { SmokeCircle } from "../../../../../../../Hero/components/Defs/SmokeCircle/smokeCircle";
import { SmokeRect } from "../../../../../../../Hero/components/Defs/SmokeRect/smokeRect";
import { YellowRect } from "../../../../../../../Hero/components/Defs/YellowRect/yellowRect";
import { SVG } from "./hero.styles";

export interface HeroProps {
  gridSize?: number;
  height?: number;
}

export const Hero = ({
  gridSize = GRID_SIZE,
  height = gridSize * 1.5,
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
      <YellowRect gridShift={3} gridSize={gridSize} />
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
