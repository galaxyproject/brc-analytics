import { TYPOGRAPHY_PROPS } from "@databiosphere/findable-ui/lib/styles/common/mui/typography";
import { Typography } from "@mui/material";
import { EmptyValue } from "@repo/shared/views/AssistantView/components/AnalysisSetup/components/Fields/components/FieldRow/components/EmptyValue/emptyValue";
import { type JSX } from "react";
import type { AttentionValueProps } from "./types";

/**
 * Renders the reason a field needs attention, falling back to its value, then
 * to "Not set" when the field has neither.
 * @param props - Component props.
 * @param props.field - Field state.
 * @returns The attention value element.
 */
export const AttentionValue = ({ field }: AttentionValueProps): JSX.Element => {
  const text = field.detail ?? field.value;
  if (!text) return <EmptyValue />;
  return (
    <Typography
      color={TYPOGRAPHY_PROPS.COLOR.WARNING}
      variant={TYPOGRAPHY_PROPS.VARIANT.BODY_SMALL_400}
    >
      {text}
    </Typography>
  );
};
