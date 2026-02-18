import { JSX } from "react";
import { Chip } from "@mui/material";
import { SuggestionChip } from "../../../types/api";
import { ChipsContainer } from "./suggestionChips.styles";

interface SuggestionChipsProps {
  chips: SuggestionChip[];
  disabled?: boolean;
  onSelect: (message: string) => void;
}

/**
 * Quick-tap suggestion chips shown below the chat input.
 * @param props - Component props
 * @param props.chips - Available suggestion chips
 * @param props.disabled - Whether chips are disabled
 * @param props.onSelect - Callback when a chip is selected
 * @returns Suggestion chips row
 */
export const SuggestionChips = ({
  chips,
  disabled,
  onSelect,
}: SuggestionChipsProps): JSX.Element | null => {
  if (chips.length === 0) return null;

  return (
    <ChipsContainer>
      {chips.map((chip) => (
        <Chip
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
