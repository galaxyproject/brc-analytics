import {
  FILL,
  GRID_SIZE,
} from "@brc-analytics/core/components/Layout/components/Section/components/SectionHero/components/Hero/common/constants";
import { ELEMENT_ID } from "@brc-analytics/core/components/Layout/components/Section/components/SectionHero/components/Hero/common/types";
import {
  getFillUrl,
  getViewBox,
} from "@brc-analytics/core/components/Layout/components/Section/components/SectionHero/components/Hero/common/utils";
import { SmokeCircle } from "@brc-analytics/core/components/Layout/components/Section/components/SectionHero/components/Hero/components/Defs/SmokeCircle/smokeCircle";
import { SmokeRect } from "@brc-analytics/core/components/Layout/components/Section/components/SectionHero/components/Hero/components/Defs/SmokeRect/smokeRect";
import { Fragment, JSX } from "react";
import { SVG } from "./hero.styles";
import { Props } from "./types";

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
