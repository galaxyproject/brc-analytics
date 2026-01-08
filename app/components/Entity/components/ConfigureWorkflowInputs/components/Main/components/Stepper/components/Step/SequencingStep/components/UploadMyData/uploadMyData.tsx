import { Props } from "./types";
import { Typography, AlertTitle } from "@mui/material";
import { TYPOGRAPHY_PROPS } from "@databiosphere/findable-ui/lib/styles/common/mui/typography";
import { ALERT_PROPS } from "@databiosphere/findable-ui/lib/components/common/Alert/constants";
import { useEffect } from "react";
import { StyledAlert } from "./uploadMyData.styles";
import { getUploadMyOwnSequencingData } from "../ENASequencingData/utils";

export const UploadMyData = ({ onConfigure, stepKey }: Props): JSX.Element => {
  useEffect(() => {
    onConfigure(getUploadMyOwnSequencingData(stepKey));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Intended behavior to only run on mount.
  }, []);
  return (
    <StyledAlert {...ALERT_PROPS.STANDARD_INFO}>
      <AlertTitle variant={TYPOGRAPHY_PROPS.VARIANT.BODY_LARGE_500}>
        Upload Your Data in Galaxy
      </AlertTitle>
      <Typography variant={TYPOGRAPHY_PROPS.VARIANT.BODY_400_2_LINES}>
        You will have an opportunity to upload your own data to your Galaxy
        history.
      </Typography>
    </StyledAlert>
  );
};
