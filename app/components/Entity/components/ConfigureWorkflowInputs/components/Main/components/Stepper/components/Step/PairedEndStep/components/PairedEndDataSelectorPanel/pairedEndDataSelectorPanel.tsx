import { Button, Typography } from "@mui/material";
import { StyledPaper } from "./pairedEndDataSelectorPanel.styles.ts";
import { TYPOGRAPHY_PROPS as MUI_TYPOGRAPHY_PROPS } from "@databiosphere/findable-ui/lib/styles/common/mui/typography";
import { BUTTON_PROPS } from "../../../components/Button/constants";
import { TYPOGRAPHY_PROPS } from "./constants";

export const PairedEndDataSelectorPanel = (): JSX.Element => {
  return (
    <StyledPaper elevation={0} square>
      <Typography {...TYPOGRAPHY_PROPS}>No Sequencing Data Selected</Typography>
      <Typography
        color={MUI_TYPOGRAPHY_PROPS.COLOR.INK_LIGHT}
        variant={MUI_TYPOGRAPHY_PROPS.VARIANT.TEXT_BODY_400}
      >
        Browse ENA to find and select a collection
      </Typography>
      <Button {...BUTTON_PROPS}>Browse</Button>
    </StyledPaper>
  );
};
