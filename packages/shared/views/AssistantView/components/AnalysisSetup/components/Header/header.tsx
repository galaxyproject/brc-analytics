import { STACK_PROPS } from "@databiosphere/findable-ui/lib/styles/common/mui/stack";
import { TYPOGRAPHY_PROPS } from "@databiosphere/findable-ui/lib/styles/common/mui/typography";
import { Typography } from "@mui/material";
import { TOTAL_FIELDS } from "@repo/shared/views/AssistantView/components/AnalysisSetup/constants";
import { countSetFields } from "@repo/shared/views/AssistantView/components/AnalysisSetup/utils";
import { type JSX } from "react";
import { StyledStack } from "./header.styles";
import type { HeaderProps } from "./types";

/**
 * Renders the analysis setup title and how many of its fields are set.
 * @param props - Component props.
 * @param props.schema - Current analysis schema, or null before the assistant has returned one.
 * @returns The header element.
 */
export const Header = ({ schema }: HeaderProps): JSX.Element => {
  return (
    <StyledStack direction={STACK_PROPS.DIRECTION.ROW}>
      <Typography
        color={TYPOGRAPHY_PROPS.COLOR.INK_MAIN}
        component="h2"
        variant={TYPOGRAPHY_PROPS.VARIANT.BODY_LARGE_500}
      >
        Analysis setup
      </Typography>
      <Typography
        color={TYPOGRAPHY_PROPS.COLOR.INK_LIGHT}
        variant={TYPOGRAPHY_PROPS.VARIANT.BODY_SMALL_500}
      >
        {countSetFields(schema)} of {TOTAL_FIELDS} set
      </Typography>
    </StyledStack>
  );
};
