import { JSX } from "react";
import { SuggestionChip as SuggestionChipType } from "../../../types/api";
import { ChipsContainer, SuggestionChip } from "./suggestionChips.styles";

interface SuggestionChipsProps {
  chips: SuggestionChipType[];
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
        <SuggestionChip
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
