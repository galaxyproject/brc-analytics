import { ToggleButton } from "@mui/material";
import { StyledToggleButtonGroup } from "./toggleButtonGroup.styles";
import { TOGGLE_BUTTON_GROUP_PROPS } from "./constants";
import { Props } from "./types";

export const ToggleButtonGroup = ({
  onChange,
  toggleButtons,
  value,
}: Props): JSX.Element => {
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
