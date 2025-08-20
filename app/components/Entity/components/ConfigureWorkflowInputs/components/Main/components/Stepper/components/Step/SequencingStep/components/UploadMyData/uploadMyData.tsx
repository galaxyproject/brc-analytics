import { Props } from "./types";
import { StyledPaper } from "./uploadMyData.styles";
import { Typography } from "@mui/material";
import { TYPOGRAPHY_PROPS } from "@databiosphere/findable-ui/lib/styles/common/mui/typography";
import { PAPER_PROPS } from "./constants";
import { useEffect } from "react";

export const UploadMyData = ({ onConfigure, stepKey }: Props): JSX.Element => {
  useEffect(() => {
    onConfigure(stepKey, []);
  }, [onConfigure, stepKey]);
  return (
    <StyledPaper {...PAPER_PROPS}>
      <Typography
        color={TYPOGRAPHY_PROPS.COLOR.INK_LIGHT}
        variant={TYPOGRAPHY_PROPS.VARIANT.BODY_400}
      >
        I&#39;ll upload my data directly to Galaxy.
      </Typography>
    </StyledPaper>
  );
};
