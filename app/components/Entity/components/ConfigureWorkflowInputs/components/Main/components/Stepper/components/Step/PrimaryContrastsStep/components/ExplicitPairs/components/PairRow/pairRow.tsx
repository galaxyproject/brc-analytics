import { JSX } from "react";
import { IconButton, Stack, MenuItem, Typography } from "@mui/material";
import { Props } from "./types";
import { StyledStack, StyledSelect } from "./pairRow.styles";
import { DeleteIcon } from "../../../../../../../../../../../../../../common/CustomIcon/components/DeleteIcon/deleteIcon";
import { TYPOGRAPHY_PROPS } from "@databiosphere/findable-ui/lib/styles/common/mui/typography";
import { ICON_BUTTON_PROPS, SELECT_PROPS, SVG_ICON_PROPS } from "./constants";
import { getDisabledValues } from "../../../../hooks/UseExplicitContrasts/utils";

export const PairRow = ({
  factorValues,
  onRemove,
  onUpdate,
  pair,
  pairId,
  pairs,
}: Props): JSX.Element => {
  const [valueA, valueB] = pair;
  const disabledA = getDisabledValues(factorValues, pairs, pairId, valueB);
  const disabledB = getDisabledValues(factorValues, pairs, pairId, valueA);
  return (
    <Stack direction="row" gap={5} useFlexGap>
      <StyledStack direction="row" gap={4} useFlexGap>
        <StyledSelect
          {...SELECT_PROPS}
          name="select-first-value"
          onChange={(e) => onUpdate(0, e.target.value as string)}
          renderValue={(value) => (value as string) || "Select value"}
          value={valueA}
        >
          {factorValues.map((value) => (
            <MenuItem disabled={disabledA.has(value)} key={value} value={value}>
              {value}
            </MenuItem>
          ))}
        </StyledSelect>
        <Typography
          color={TYPOGRAPHY_PROPS.COLOR.INK_LIGHT}
          variant={TYPOGRAPHY_PROPS.VARIANT.BODY_400}
        >
          vs
        </Typography>
        <StyledSelect
          {...SELECT_PROPS}
          name="select-second-value"
          onChange={(e) => onUpdate(1, e.target.value as string)}
          renderValue={(value) => (value as string) || "Select value"}
          value={valueB}
        >
          {factorValues.map((value) => (
            <MenuItem disabled={disabledB.has(value)} key={value} value={value}>
              {value}
            </MenuItem>
          ))}
        </StyledSelect>
      </StyledStack>
      <IconButton {...ICON_BUTTON_PROPS} onClick={onRemove}>
        <DeleteIcon {...SVG_ICON_PROPS} />
      </IconButton>
    </Stack>
  );
};
