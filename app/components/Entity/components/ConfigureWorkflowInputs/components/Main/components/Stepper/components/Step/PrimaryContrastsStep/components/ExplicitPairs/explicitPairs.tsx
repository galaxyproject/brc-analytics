import { AddRounded } from "@mui/icons-material";
import { BUTTON_PROPS } from "@databiosphere/findable-ui/lib/components/common/Button/constants";
import { Props } from "./types";
import { StyledStack } from "./explicitPairs.styles";
import { PairRow } from "./components/PairRow/pairRow";
import { Button, Typography } from "@mui/material";
import { TYPOGRAPHY_PROPS } from "@databiosphere/findable-ui/lib/styles/common/mui/typography";
import { SVG_ICON_PROPS } from "@databiosphere/findable-ui/lib/styles/common/mui/svgIcon";
import { CONTRAST_MODE } from "../../hooks/UseRadioGroup/types";

export const ExplicitPairs = ({
  factorValues,
  mode,
  onAddPair,
  onRemovePair,
  onUpdatePair,
  pairs,
}: Props): JSX.Element | null => {
  if (mode !== CONTRAST_MODE.EXPLICIT) return null;
  return (
    <StyledStack gap={4} useFlexGap>
      <Typography variant={TYPOGRAPHY_PROPS.VARIANT.BODY_500}>
        Explicit Pair(s)
      </Typography>
      {[...pairs.entries()].map(([id, pair]) => (
        <PairRow
          key={id}
          factorValues={factorValues}
          onRemove={() => onRemovePair(id)}
          onUpdate={(position, value) => onUpdatePair(id, position, value)}
          pair={pair}
        />
      ))}
      <Button
        {...BUTTON_PROPS.SECONDARY_CONTAINED}
        onClick={onAddPair}
        startIcon={<AddRounded color={SVG_ICON_PROPS.COLOR.INK_LIGHT} />}
      >
        Add pair
      </Button>
    </StyledStack>
  );
};
