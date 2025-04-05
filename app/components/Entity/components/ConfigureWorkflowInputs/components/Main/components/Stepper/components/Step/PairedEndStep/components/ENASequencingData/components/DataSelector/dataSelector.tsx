import { Button, Typography } from "@mui/material";
import { StyledPaper } from "./dataSelector.styles";
import { TYPOGRAPHY_PROPS as MUI_TYPOGRAPHY_PROPS } from "@databiosphere/findable-ui/lib/styles/common/mui/typography";
import { BUTTON_PROPS } from "../../../../../components/Button/constants";
import { PAPER_PROPS, TYPOGRAPHY_PROPS } from "./constants";
import { Props } from "./types";

export const DataSelector = ({
  onOpen,
  selectedCount,
}: Props): JSX.Element | null => {
  if (selectedCount > 0) return null;
  return (
    <StyledPaper {...PAPER_PROPS}>
      <Typography {...TYPOGRAPHY_PROPS}>No Sequencing Data Selected</Typography>
      <Typography
        color={MUI_TYPOGRAPHY_PROPS.COLOR.INK_LIGHT}
        variant={MUI_TYPOGRAPHY_PROPS.VARIANT.TEXT_BODY_400}
      >
        Browse ENA to find and select a collection
      </Typography>
      <Button {...BUTTON_PROPS} onClick={onOpen}>
        Browse
      </Button>
    </StyledPaper>
  );
};
