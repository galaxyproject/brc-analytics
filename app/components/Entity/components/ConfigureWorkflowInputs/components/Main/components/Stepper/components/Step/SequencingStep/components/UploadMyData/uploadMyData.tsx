import { Props } from "./types";
import { Typography, AlertTitle } from "@mui/material";
import { TYPOGRAPHY_PROPS } from "@databiosphere/findable-ui/lib/styles/common/mui/typography";
import { ALERT_PROPS } from "@databiosphere/findable-ui/lib/components/common/Alert/constants";
import { useEffect } from "react";
import { StyledAlert } from "./uploadMyData.styles";

export const UploadMyData = ({ onConfigure, stepKey }: Props): JSX.Element => {
  useEffect(() => {
    onConfigure(stepKey, []);
  }, [onConfigure, stepKey]);
  return (
    <StyledAlert {...ALERT_PROPS.STANDARD_INFO}>
      <AlertTitle variant={TYPOGRAPHY_PROPS.VARIANT.BODY_LARGE_500}>
        Upload Your Info in Galaxy
      </AlertTitle>
      <Typography variant={TYPOGRAPHY_PROPS.VARIANT.BODY_400_2_LINES}>
        You will have an opportunity to upload your own data to your Galaxy
        history.
      </Typography>
    </StyledAlert>
  );
};
