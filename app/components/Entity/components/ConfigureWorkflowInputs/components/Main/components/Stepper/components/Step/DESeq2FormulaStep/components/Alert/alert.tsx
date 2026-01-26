import { JSX } from "react";
import { AlertTitle } from "@mui/material";
import { ALERT_PROPS } from "@databiosphere/findable-ui/lib/components/common/Alert/constants";
import { StyledAlert } from "./alert.styles";
import { Props } from "./types";

export const Alert = ({ formula }: Props): JSX.Element | null => {
  if (!formula) return null;
  return (
    <StyledAlert {...ALERT_PROPS.STANDARD_INFO} icon={false}>
      <AlertTitle>Formula:</AlertTitle>
      {formula}
    </StyledAlert>
  );
};
