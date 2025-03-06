import { Props } from "./types";
import { Fragment } from "react";
import { StyledTypography } from "./analysisMethods.styles";
import { TYPOGRAPHY_PROPS } from "./constants";

export const AnalysisMethods = ({ children }: Props): JSX.Element => {
  return (
    <Fragment>
      <StyledTypography {...TYPOGRAPHY_PROPS}>
        Select a Workflow
      </StyledTypography>
      {children}
    </Fragment>
  );
};
