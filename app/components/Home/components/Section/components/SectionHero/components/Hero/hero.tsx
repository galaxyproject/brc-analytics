import { Fragment } from "react";
import {
  FILL,
  GRID_SIZE,
} from "../../../../../../../Layout/components/Hero/common/constants";
import {
  ELEMENT_ID,
  Height,
} from "../../../../../../../Layout/components/Hero/common/entities";
import {
  getElementHref,
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
  height?: Height;
}

export const Hero = ({
  gridSize = GRID_SIZE,
  height = GRID_SIZE * 3,
}: HeroProps): JSX.Element => {
  return (
    <SVG
      fill={FILL.NONE}
      height={height}
      preserveAspectRatio="xMinYMin meet"
      viewBox={getViewBox(gridSize, height)}
      width="100vw"
      xmlns="http://www.w3.org/2000/svg"
    >
      <SmokeRect gridSize={gridSize} />
      <SmokeCircle gridSize={gridSize} />
      <BlueRect gridSize={gridSize} />
      <YellowRect gridSize={gridSize} />
      <BlueCircle gridSize={gridSize} />
      <CoralPinkCircle gridSize={gridSize} />
      {[
        ELEMENT_ID.PATTERN_SMOKE_RECT,
        ELEMENT_ID.PATTERN_SMOKE_CIRCLE,
        // ELEMENT_ID.PATTERN_BLUE_RECT,
        // ELEMENT_ID.PATTERN_YELLOW_RECT,
      ].map((elementId) => (
        <Fragment key={elementId}>
          <rect
            fill={getFillUrl(elementId)}
            height={height}
            width="100vw"
            x={0}
            y={0}
          />
        </Fragment>
      ))}
      {/*<use href={getElementHref(ELEMENT_ID.GROUP_BLUE_CIRCLE)} x={0} />*/}
      <use href={getElementHref(ELEMENT_ID.GROUP_CORAL_PINK_CIRLCLE)} />
    </SVG>
  );
};
