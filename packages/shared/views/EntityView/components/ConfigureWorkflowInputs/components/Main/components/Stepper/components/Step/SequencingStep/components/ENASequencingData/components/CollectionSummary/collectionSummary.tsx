import { BUTTON_PRESETS } from "@databiosphere/findable-ui/lib/contracts/mui/Button/presets";
import { TYPOGRAPHY_PROPS } from "@databiosphere/findable-ui/lib/styles/common/mui/typography";
import { Button, Grid, Typography } from "@mui/material";
import { Fragment, type JSX } from "react";
import { StyledRoundedPaper } from "./collectionSummary.styles";
import { Alert } from "./components/Alert/alert";
import { type Props } from "./types";

export const CollectionSummary = ({
  onClear,
  onEdit,
  requirementsMatches,
  selectedCount,
}: Props): JSX.Element | null => {
  if (selectedCount === 0) return null;
  return (
    <Fragment>
      <Alert requirementsMatches={requirementsMatches} />
      <StyledRoundedPaper elevation={0}>
        <Typography variant={TYPOGRAPHY_PROPS.VARIANT.BODY_400}>
          {selectedCount} Collection{selectedCount > 1 ? "s" : ""} Selected
        </Typography>
        <Grid container gap={2}>
          <Button {...BUTTON_PRESETS.SECONDARY_OUTLINED} onClick={onEdit}>
            Edit list
          </Button>
          <Button {...BUTTON_PRESETS.SECONDARY_OUTLINED} onClick={onClear}>
            Clear all
          </Button>
        </Grid>
      </StyledRoundedPaper>
    </Fragment>
  );
};
