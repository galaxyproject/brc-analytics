import { ALERT_PROPS } from "@databiosphere/findable-ui/lib/components/common/Alert/constants";
import { SIZE } from "@databiosphere/findable-ui/lib/styles/common/constants/size";
import { AlertTitle } from "@mui/material";
import { JSX } from "react";
import { StyledAlert } from "./alert.styles";
import { Props } from "./types";

export const Alert = ({ requirementsMatches }: Props): JSX.Element | null => {
  if (requirementsMatches.length === 0) return null;
  return (
    <StyledAlert {...ALERT_PROPS.STANDARD_INFO} size={SIZE.LARGE}>
      <AlertTitle>
        Some selected data may not match expected criteria
      </AlertTitle>
      <ul>
        {requirementsMatches.map((requirement) => (
          <li key={requirement}>{requirement}</li>
        ))}
      </ul>
    </StyledAlert>
  );
};
