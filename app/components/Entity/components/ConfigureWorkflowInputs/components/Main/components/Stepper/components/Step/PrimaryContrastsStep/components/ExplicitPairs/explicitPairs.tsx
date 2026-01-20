import { Props } from "./types";
import { StyledStack } from "./explicitPairs.styles";
import { PairRow } from "./components/PairRow/pairRow";
import { Typography } from "@mui/material";
import { TYPOGRAPHY_PROPS } from "@databiosphere/findable-ui/lib/styles/common/mui/typography";
import { CONTRAST_MODE } from "../../hooks/UseRadioGroup/types";

export const ExplicitPairs = ({
  factorValues,
  mode,
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
    </StyledStack>
  );
};
