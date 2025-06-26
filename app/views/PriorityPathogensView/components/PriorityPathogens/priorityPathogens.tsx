import { Props } from "./types";
import {
  Section,
  SectionContent,
} from "@databiosphere/findable-ui/lib/components/common/Section/section.styles";
import { Chip, Typography } from "@mui/material";
import { TYPOGRAPHY_PROPS } from "@databiosphere/findable-ui/lib/styles/common/mui/typography";
import { CHIP_PROPS } from "@databiosphere/findable-ui/lib/styles/common/mui/chip";
import { MDXRemote } from "next-mdx-remote";
import { StyledGrid, StyledSectionText } from "./priorityPathogens.styles";
import { FluidPaper } from "@databiosphere/findable-ui/lib/components/common/Paper/paper.styles";
import { getPriorityColor, getPriorityLabel } from "./utils";

export const PriorityPathogens = ({
  priorityPathogens,
}: Props): JSX.Element => {
  return (
    <StyledGrid container gap={4}>
      {priorityPathogens.map((priorityPathogen) => (
        <FluidPaper key={priorityPathogen.name}>
          <Section>
            <SectionContent>
              <Typography
                variant={TYPOGRAPHY_PROPS.VARIANT.TEXT_HEADING_XSMALL}
              >
                {priorityPathogen.name}
              </Typography>
              <StyledSectionText
                color={TYPOGRAPHY_PROPS.COLOR.INK_LIGHT}
                variant={TYPOGRAPHY_PROPS.VARIANT.TEXT_BODY_400_2_LINES}
              >
                <MDXRemote {...priorityPathogen.description} />
              </StyledSectionText>
            </SectionContent>
            <Chip
              color={getPriorityColor(priorityPathogen.priority)}
              label={getPriorityLabel(priorityPathogen.priority)}
              variant={CHIP_PROPS.VARIANT.STATUS}
            />
          </Section>
        </FluidPaper>
      ))}
    </StyledGrid>
  );
};
