import { Button, Typography, Grid } from "@mui/material";
import { StyledRoundedPaper } from "./collectionSummary.styles";
import { Props } from "./types";
import { TYPOGRAPHY_PROPS } from "@databiosphere/findable-ui/lib/styles/common/mui/typography";
import { BUTTON_PROPS } from "@databiosphere/findable-ui/lib/components/common/Button/constants";
import { StyledToolbar } from "@databiosphere/findable-ui/lib/components/Table/components/TableToolbar/tableToolbar.styles";

export const CollectionSummary = ({
  onClear,
  onEdit,
  selectedCount,
  table,
}: Props): JSX.Element | null => {
  const count = Object.keys(table.getState().rowSelection).length;
  if (selectedCount === 0) return null;
  return (
    <StyledRoundedPaper elevation={0}>
      <StyledToolbar>
        <Typography variant={TYPOGRAPHY_PROPS.VARIANT.BODY_400}>
          {count} Collection{count > 1 ? "s" : ""} Selected
        </Typography>
        <Grid container gap={2}>
          <Button {...BUTTON_PROPS.SECONDARY_CONTAINED} onClick={onEdit}>
            Edit list
          </Button>
          <Button {...BUTTON_PROPS.SECONDARY_CONTAINED} onClick={onClear}>
            Clear all
          </Button>
        </Grid>
      </StyledToolbar>
    </StyledRoundedPaper>
  );
};
