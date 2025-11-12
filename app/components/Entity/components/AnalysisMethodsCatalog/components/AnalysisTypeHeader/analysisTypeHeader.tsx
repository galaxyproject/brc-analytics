import { Typography } from "@mui/material";
import { TYPOGRAPHY_PROPS } from "@databiosphere/findable-ui/lib/styles/common/mui/typography";
import { StyledStack } from "./analysisTypeHeader.styles";
import { Props } from "./types";

export const AnalysisTypeHeader = ({
  description,
  title,
}: Props): JSX.Element => {
  return (
    <StyledStack gap={2} useFlexGap>
      <Typography
        component="h2"
        variant={TYPOGRAPHY_PROPS.VARIANT.HEADING_SMALL}
      >
        {title}
      </Typography>
      <Typography
        color={TYPOGRAPHY_PROPS.COLOR.INK_LIGHT}
        variant={TYPOGRAPHY_PROPS.VARIANT.BODY_400_2_LINES}
      >
        {description}
      </Typography>
    </StyledStack>
  );
};
