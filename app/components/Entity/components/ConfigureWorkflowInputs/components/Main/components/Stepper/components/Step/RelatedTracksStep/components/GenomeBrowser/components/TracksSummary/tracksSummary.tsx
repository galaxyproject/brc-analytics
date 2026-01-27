import { JSX } from "react";
import { Button, Typography, Grid } from "@mui/material";
import { StyledRoundedPaper } from "./tracksSummary.styles";
import { Props } from "./types";
import { TYPOGRAPHY_PROPS } from "@databiosphere/findable-ui/lib/styles/common/mui/typography";
import { BUTTON_PROPS } from "@databiosphere/findable-ui/lib/components/common/Button/constants";

export const TracksSummary = ({
  onClear,
  onEdit,
  selectedCount,
  table,
}: Props): JSX.Element | null => {
  const count = Object.keys(table.getState().rowSelection).length;
  if (selectedCount === 0) return null;
  return (
    <StyledRoundedPaper elevation={0}>
      <Typography variant={TYPOGRAPHY_PROPS.VARIANT.BODY_400}>
        {count} Track{count > 1 ? "s" : ""} Selected
      </Typography>
      <Grid container gap={2}>
        <Button {...BUTTON_PROPS.SECONDARY_CONTAINED} onClick={onEdit}>
          Edit list
        </Button>
        <Button {...BUTTON_PROPS.SECONDARY_CONTAINED} onClick={onClear}>
          Clear all
        </Button>
      </Grid>
    </StyledRoundedPaper>
  );
};
