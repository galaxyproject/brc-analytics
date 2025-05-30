import { ToggleButton, ToggleButtonGroupProps } from "@mui/material";
import { TOGGLE_BUTTONS } from "./toggleButtons";
import { StyledToggleButtonGroup } from "./toggleButtonGroup.styles";
import { TOGGLE_BUTTON_GROUP_PROPS } from "./constants";

const toggleButtons = TOGGLE_BUTTONS;

export const ToggleButtonGroup = ({
  onChange,
  value,
}: ToggleButtonGroupProps): JSX.Element => {
  return (
    <StyledToggleButtonGroup
      {...TOGGLE_BUTTON_GROUP_PROPS}
      onChange={onChange}
      value={value}
    >
      {toggleButtons.map(({ children, disabled, value }, index) => (
        <ToggleButton disabled={disabled} key={index} value={value}>
          {children}
        </ToggleButton>
      ))}
    </StyledToggleButtonGroup>
  );
};
