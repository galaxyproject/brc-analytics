import { Props } from "./types";
import { AlertTitle } from "@mui/material";
import { ALERT_PROPS } from "@databiosphere/findable-ui/lib/components/common/Alert/constants";
import { StyledAlert } from "./alert.styles";
import { SIZE } from "@databiosphere/findable-ui/lib/styles/common/constants/size";

export const Alert = ({ requirementsMatches }: Props): JSX.Element | null => {
  if (requirementsMatches.length === 0) return null;
  return (
    <StyledAlert {...ALERT_PROPS.STANDARD_WARNING} size={SIZE.LARGE}>
      <AlertTitle>Some selected data may not match requirements</AlertTitle>
      <ul>
        {requirementsMatches.map((requirement) => (
          <li key={requirement}>{requirement}</li>
        ))}
      </ul>
    </StyledAlert>
  );
};
