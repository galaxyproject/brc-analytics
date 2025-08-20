import { Props } from "./types";
import {
  Section,
  SectionContent,
} from "@databiosphere/findable-ui/lib/components/common/Section/section.styles";
import { CardActionArea, Chip, Typography } from "@mui/material";
import { TYPOGRAPHY_PROPS } from "@databiosphere/findable-ui/lib/styles/common/mui/typography";
import { CHIP_PROPS } from "@databiosphere/findable-ui/lib/styles/common/mui/chip";
import { MDXRemote } from "next-mdx-remote";
import { StyledGrid, StyledSectionText } from "./priorityPathogens.styles";
import { FluidPaper } from "@databiosphere/findable-ui/lib/components/common/Paper/paper.styles";
import { getPriorityColor, getPriorityLabel } from "./utils";
import { useRouter } from "next/router";
import { ROUTES } from "../../../../../routes/constants";
import slugify from "slugify";
import { SLUGIFY_OPTIONS } from "../../../../common/constants";

export const PriorityPathogens = ({
  priorityPathogens,
}: Props): JSX.Element => {
  const { push } = useRouter();
  return (
    <StyledGrid container gap={4}>
      {priorityPathogens.map((priorityPathogen) => {
        const entityId = slugify(priorityPathogen.name, SLUGIFY_OPTIONS);
        return (
          <FluidPaper key={priorityPathogen.name}>
            <CardActionArea
              onClick={() =>
                push({
                  pathname: ROUTES.PRIORITY_PATHOGEN,
                  query: { entityId, entityListType: "priority-pathogens" },
                })
              }
            >
              <Section>
                <SectionContent>
                  <Typography variant={TYPOGRAPHY_PROPS.VARIANT.HEADING_XSMALL}>
                    {priorityPathogen.name}
                  </Typography>
                  <StyledSectionText
                    color={TYPOGRAPHY_PROPS.COLOR.INK_LIGHT}
                    variant={TYPOGRAPHY_PROPS.VARIANT.BODY_400_2_LINES}
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
            </CardActionArea>
          </FluidPaper>
        );
      })}
    </StyledGrid>
  );
};
