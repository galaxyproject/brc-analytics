import { CHIP_PROPS } from "@databiosphere/findable-ui/lib/styles/common/mui/chip";
import { STACK_PROPS } from "@databiosphere/findable-ui/lib/styles/common/mui/stack";
import { TYPOGRAPHY_PROPS } from "@databiosphere/findable-ui/lib/styles/common/mui/typography";
import { Chip, Stack, Tooltip, Typography } from "@mui/material";
import { Fragment, JSX } from "react";
import { SpeciesCellProps } from "../../types";

/**
 * Renders the species cell's minor taxonomy fields as a wrapping row of chips —
 * the strain/isolate/serotype/taxonomic-group tags plus the priority-pathogen
 * chip. Tags are provided pre-filtered by the view builder, so a chip renders
 * only when present; renders nothing when there are no tags and no priority
 * pathogen.
 * @param props - Component props.
 * @param props.priorityPathogen - Priority-pathogen chip and tooltip, when present.
 * @param props.tags - Minor taxonomy fields rendered as label/value chips.
 * @returns The tag list, or null when there is nothing to show.
 */
export const TagList = ({
  priorityPathogen,
  tags = [],
}: Pick<SpeciesCellProps, "priorityPathogen" | "tags">): JSX.Element | null => {
  if (tags.length === 0 && !priorityPathogen) return null;
  return (
    <Stack
      direction={STACK_PROPS.DIRECTION.ROW}
      flexWrap="wrap"
      spacing={2}
      useFlexGap
    >
      {tags.map((tag) => (
        <Chip
          key={tag.label}
          label={
            <Fragment>
              <Typography
                color={TYPOGRAPHY_PROPS.COLOR.INK_LIGHT}
                component="span"
                sx={{ mr: 1 }}
                variant={TYPOGRAPHY_PROPS.VARIANT.BODY_SMALL_400}
              >
                {tag.label}
              </Typography>
              <Typography
                color={TYPOGRAPHY_PROPS.COLOR.INK_MAIN}
                component="span"
              >
                {tag.value}
              </Typography>
            </Fragment>
          }
          variant={CHIP_PROPS.VARIANT.STATUS}
        />
      ))}
      {priorityPathogen && (
        <Tooltip {...priorityPathogen.tooltip}>
          <Chip {...priorityPathogen.chip} />
        </Tooltip>
      )}
    </Stack>
  );
};
