import { ConfidenceRow } from "@brc/views/GeneDetailView/components/BionymSection/bionymSection.styles";
import { CONFIDENCE_STEP } from "@brc/views/GeneDetailView/components/BionymSection/constants";
import { roundToStep } from "@brc/views/GeneDetailView/components/BionymSection/utils";
import { TYPOGRAPHY_PROPS } from "@databiosphere/findable-ui/lib/styles/common/mui/typography";
import { Slider, Typography } from "@mui/material";
import { type JSX, useId } from "react";
import { type ConfidenceControlProps } from "./types";

/**
 * The minimum-confidence slider, with a count of what it lets through.
 * @param props - Component props.
 * @param props.count - What the slider lets through, as "N of M claims".
 * @param props.minConfidence - The slider's value.
 * @param props.onMinConfidenceChange - Called with the slider's new value.
 * @returns The control.
 */
export const ConfidenceControl = ({
  count,
  minConfidence,
  onMinConfidenceChange,
}: ConfidenceControlProps): JSX.Element => {
  const labelId = useId();
  return (
    <ConfidenceRow>
      <Typography id={labelId} variant={TYPOGRAPHY_PROPS.VARIANT.BODY_500}>
        Minimum confidence
      </Typography>
      <Slider
        aria-labelledby={labelId}
        max={1}
        min={0}
        onChange={(_, value): void =>
          onMinConfidenceChange(roundToStep(value as number))
        }
        size="small"
        step={CONFIDENCE_STEP}
        value={minConfidence}
        valueLabelDisplay="auto"
      />
      <Typography
        color={TYPOGRAPHY_PROPS.COLOR.INK_LIGHT}
        variant={TYPOGRAPHY_PROPS.VARIANT.BODY_400}
      >
        {count}
      </Typography>
    </ConfidenceRow>
  );
};
