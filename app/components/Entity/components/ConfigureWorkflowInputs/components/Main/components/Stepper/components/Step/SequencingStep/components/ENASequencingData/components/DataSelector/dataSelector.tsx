import { Button, Grid, Typography } from "@mui/material";
import { StyledPaper } from "./dataSelector.styles";
import { TYPOGRAPHY_PROPS } from "@databiosphere/findable-ui/lib/styles/common/mui/typography";
import { PAPER_PROPS } from "./constants";
import { Props } from "./types";
import { BUTTON_PROPS } from "@databiosphere/findable-ui/lib/components/common/Button/constants";
import { renderBrowseText, canBrowseAll, getReadCount } from "./utils";

export const DataSelector = ({
  genome,
  onContinue,
  onOpen,
  onRequestDataByTaxonomy,
  selectedCount,
}: Props): JSX.Element | null => {
  if (selectedCount > 0) return null;
  const readCount = getReadCount(genome);
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
      <Grid container gap={4}>
        <Button {...BUTTON_PROPS.PRIMARY_CONTAINED} onClick={onOpen}>
          {renderBrowseText(readCount)}
        </Button>
        {canBrowseAll(readCount) && (
          <Button
            {...BUTTON_PROPS.PRIMARY_CONTAINED}
            onClick={() =>
              onRequestDataByTaxonomy(genome.ncbiTaxonomyId, {
                onSuccess: onContinue,
              })
            }
          >
            Browse All ({readCount})
          </Button>
        )}
      </Grid>
    </StyledPaper>
  );
};
