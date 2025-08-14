import { Button, Typography } from "@mui/material";
import { StyledPaper } from "./dataSelector.styles";
import { TYPOGRAPHY_PROPS } from "@databiosphere/findable-ui/lib/styles/common/mui/typography";
import { PAPER_PROPS } from "./constants";
import { Props } from "./types";
import { BUTTON_PROPS } from "@databiosphere/findable-ui/lib/components/common/Button/constants";

export const DataSelector = ({
  onOpen,
  selectedCount,
}: Props): JSX.Element | null => {
  if (selectedCount > 0) return null;
  return (
    <StyledPaper {...PAPER_PROPS}>
      <Typography
        component="div"
        variant={TYPOGRAPHY_PROPS.VARIANT.HEADING_XSMALL}
      >
        No Sequencing Data Selected
      </Typography>
      <Typography
        color={TYPOGRAPHY_PROPS.COLOR.INK_LIGHT}
        variant={TYPOGRAPHY_PROPS.VARIANT.BODY_400}
      >
        Browse ENA to find and select a collection
      </Typography>
      <Button {...BUTTON_PROPS.PRIMARY_CONTAINED} onClick={onOpen}>
        Browse
      </Button>
    </StyledPaper>
  );
};
