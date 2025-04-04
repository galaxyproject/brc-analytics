import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  OutlinedInput,
  Typography,
} from "@mui/material";
import { StyledPaper } from "./dataSelector.styles";
import { TYPOGRAPHY_PROPS as MUI_TYPOGRAPHY_PROPS } from "@databiosphere/findable-ui/lib/styles/common/mui/typography";
import { BUTTON_PROPS } from "../../../../../components/Button/constants";
import { TYPOGRAPHY_PROPS } from "./constants";
import { Props } from "./types";
import { Fragment } from "react";
import { useDialog } from "@databiosphere/findable-ui/lib/components/common/Dialog/hooks/useDialog";
import { PAPER_PROPS } from "./constants";
import { AccessionSelector } from "../AccessionSelector/accessionSelector";

export const DataSelector = ({
  clearErrors,
  onRequestData,
  onSelect,
  requestStatus,
}: Props): JSX.Element => {
  const { onClose, onOpen, open } = useDialog();
  return (
    <Fragment>
      <StyledPaper {...PAPER_PROPS}>
        <Typography {...TYPOGRAPHY_PROPS}>
          No Sequencing Data Selected
        </Typography>
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
      <AccessionSelector
        clearErrors={clearErrors}
        onClose={onClose}
        onRequestData={onRequestData}
        onSelect={onSelect}
        open={open}
        requestStatus={requestStatus}
      />
    </Fragment>
  );
};
