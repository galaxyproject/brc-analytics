import { Fragment, type JSX } from "react";
import { FILL, GRID_SIZE } from "./common/constants";
import { ELEMENT_ID } from "./common/types";
import { getFillUrl, getViewBox } from "./common/utils";
import { SmokeCircle } from "./components/Defs/SmokeCircle/smokeCircle";
import { SmokeRect } from "./components/Defs/SmokeRect/smokeRect";
import { SVG } from "./hero.styles";
import type { Props } from "./types";

export const Hero = ({
  gridSize = GRID_SIZE,
  height = gridSize * 1.5,
  width = 0,
}: Props): JSX.Element => {
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
