import { STACK_PROPS } from "@databiosphere/findable-ui/lib/styles/common/mui/stack";
import { Stack } from "@mui/material";
import { JSX } from "react";
import { BAR_COUNT } from "./constants";
import { StyledBox } from "./levelCell.styles";
import type { Props } from "./types";

/*
 * Renders the assembly level as a tiered bar indicator (one filled bar per tier:
 * Complete Genome = 4, Chromosome = 3, Scaffold = 2, Contig = 1) followed by the
 * level label. The view builder maps the level value to its filled-bar count.
 */
export const LevelCell = ({ filledCount, label }: Props): JSX.Element => {
  return (
    <Stack
      alignItems={STACK_PROPS.ALIGN_ITEMS.CENTER}
      direction={STACK_PROPS.DIRECTION.ROW}
      gap={1}
      useFlexGap
    >
      <Stack direction={STACK_PROPS.DIRECTION.ROW} gap={0.25} useFlexGap>
        {Array.from({ length: BAR_COUNT }, (_, i) => (
          <StyledBox filled={i < filledCount} key={i} />
        ))}
      </Stack>
      <span>{label}</span>
    </Stack>
  );
};
