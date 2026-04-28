import { JSX } from "react";
import { SuggestionChip } from "../../../types/api";
import { ChipsContainer, StyledSuggestionChip } from "./suggestionChips.styles";

interface SuggestionChipsProps {
  chips: SuggestionChip[];
  disabled?: boolean;
  onSelect: (message: string) => void;
}

export const SuggestionChips = ({
  chips,
  disabled,
  onSelect,
}: SuggestionChipsProps): JSX.Element | null => {
  if (chips.length === 0) return null;

  return (
    <ChipsContainer>
      {chips.map((chip) => (
        <StyledSuggestionChip
          clickable
          disabled={disabled}
          key={chip.label}
          label={chip.label}
          onClick={(): void => onSelect(chip.message)}
          size="small"
          variant="outlined"
        />
      ))}
    </ChipsContainer>
  );
};
