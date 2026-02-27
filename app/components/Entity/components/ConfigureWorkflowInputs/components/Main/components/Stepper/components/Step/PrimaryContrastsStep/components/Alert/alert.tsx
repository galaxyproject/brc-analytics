import { JSX } from "react";
import { ALERT_PROPS } from "@databiosphere/findable-ui/lib/components/common/Alert/constants";
import { StyledAlert } from "./alert.styles";
import { Props } from "./types";

export const Alert = ({
  factorValues,
  primaryFactor,
}: Props): JSX.Element | null => {
  if (!primaryFactor) return null;
  if (factorValues.length > 1) return null;
  return (
    <StyledAlert {...ALERT_PROPS.STANDARD_ERROR} icon={false}>
      The primary factor &quot;{primaryFactor}&quot; does not have enough unique
      values. At least 2 unique values are required to define contrasts.
    </StyledAlert>
  );
};
