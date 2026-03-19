import {
  StaticImage,
  StaticImageProps,
} from "@databiosphere/findable-ui/lib/components/common/StaticImage/staticImage";
import {
  ANCHOR_TARGET,
  REL_ATTRIBUTE,
} from "@databiosphere/findable-ui/lib/components/Links/common/entities";
import { TYPOGRAPHY_PROPS } from "@databiosphere/findable-ui/lib/styles/common/mui/typography";
import { Typography } from "@mui/material";
import { JSX } from "react";
import { Section } from "../../../../views/EntityView/ui/Section/section";
import { SectionTitle } from "../../../../views/EntityView/ui/SectionTitle/sectionTitle";
import { StyledButtonBase } from "./analysisPortals.styles";

export interface AnalysisPortals {
  imageProps: StaticImageProps;
  label: string;
  url: string;
}

interface AnalysisPortalsProps {
  portals: AnalysisPortals[];
  title: string;
}

export const AnalysisPortals = ({
  portals,
  title,
}: AnalysisPortalsProps): JSX.Element => {
  if (portals.length === 0) return <span>None</span>;
  return (
    <Section>
      <SectionTitle>{title}</SectionTitle>
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
    </Section>
  );
};
