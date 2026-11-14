import { SwitchGrid } from "@brc/views/GeneDetailView/components/BionymSection/components/GraphPanel/graphPanel.styles";
import { TYPOGRAPHY_PROPS } from "@databiosphere/findable-ui/lib/styles/common/mui/typography";
import { FormControlLabel, Switch, Typography } from "@mui/material";
import { type JSX, useId } from "react";
import { type EdgeKindSwitchesProps } from "./types";

/**
 * A switch for each kind of edge in the graph, with its count, to show or
 * hide it.
 * @param props - Component props.
 * @param props.counts - Each kind of edge and its count, most first.
 * @param props.hidden - The kinds of edge hidden.
 * @param props.onToggle - Called with the kind of edge switched.
 * @returns The switches.
 */
export const EdgeKindSwitches = ({
  counts,
  hidden,
  onToggle,
}: EdgeKindSwitchesProps): JSX.Element => {
  const labelId = useId();
  return (
    <div aria-labelledby={labelId} role="group">
      <Typography
        component="h3"
        id={labelId}
        variant={TYPOGRAPHY_PROPS.VARIANT.BODY_500}
      >
        Kinds of edge
      </Typography>
      <SwitchGrid>
        {counts.map(([predicate, count]) => (
          <FormControlLabel
            control={
              <Switch
                checked={!hidden.has(predicate)}
                onChange={(): void => onToggle(predicate)}
                size="small"
              />
            }
            key={predicate}
            label={`${predicate} (${count})`}
          />
        ))}
      </SwitchGrid>
    </div>
  );
};
