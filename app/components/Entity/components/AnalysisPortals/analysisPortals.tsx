import { JSX } from "react";
import {
  StaticImage,
  StaticImageProps,
} from "@databiosphere/findable-ui/lib/components/common/StaticImage/staticImage";
import {
  ANCHOR_TARGET,
  REL_ATTRIBUTE,
} from "@databiosphere/findable-ui/lib/components/Links/common/entities";
import { Typography } from "@mui/material";
import { Fragment } from "react";
import { StyledButtonBase } from "./analysisPortals.styles";
import { TYPOGRAPHY_PROPS } from "@databiosphere/findable-ui/lib/styles/common/mui/typography";

export interface AnalysisPortals {
  imageProps: StaticImageProps;
  label: string;
  url: string;
}

interface AnalysisPortalsProps {
  portals: AnalysisPortals[];
}

export const AnalysisPortals = ({
  portals,
}: AnalysisPortalsProps): JSX.Element => {
  if (portals.length === 0) return <span>None</span>;
  return (
    <Fragment>
      {portals.map(({ imageProps, label, url }) => (
        <StyledButtonBase
          key={label}
          onClick={(): void => {
            window.open(
              url,
              ANCHOR_TARGET.BLANK,
              REL_ATTRIBUTE.NO_OPENER_NO_REFERRER
            );
          }}
        >
          <StaticImage {...imageProps} key={label} />
          <Typography variant={TYPOGRAPHY_PROPS.VARIANT.BODY_400}>
            {label}
          </Typography>
        </StyledButtonBase>
      ))}
    </Fragment>
  );
};
