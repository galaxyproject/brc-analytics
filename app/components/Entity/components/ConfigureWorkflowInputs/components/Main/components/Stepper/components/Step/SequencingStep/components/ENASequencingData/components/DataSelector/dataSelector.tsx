import { Button, Grid, Typography } from "@mui/material";
import { StyledPaper } from "./dataSelector.styles";
import { TYPOGRAPHY_PROPS } from "@databiosphere/findable-ui/lib/styles/common/mui/typography";
import { GRID_PROPS, PAPER_PROPS } from "./constants";
import { BUTTON_PROPS } from "@databiosphere/findable-ui/lib/components/common/Button/constants";
import { LoadingIcon } from "@databiosphere/findable-ui/lib/components/common/CustomIcon/components/LoadingIcon/loadingIcon";
import { SVG_ICON_PROPS } from "@databiosphere/findable-ui/lib/styles/common/mui/svgIcon";
import { Props } from "./types";
import { MAX_READ_RUNS_FOR_BROWSE_ALL } from "../../hooks/UseENADataByTaxonomyId/constants";
import { ENA_QUERY_METHOD } from "../../../../types";

export const DataSelector = ({
  loading,
  onContinue,
  onOpen,
  readCount = MAX_READ_RUNS_FOR_BROWSE_ALL,
  selectedCount,
  setEnaQueryMethod,
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
        Browse ENA to find and select sequences
      </Typography>
      {loading ? (
        <LoadingIcon
          color={SVG_ICON_PROPS.COLOR.PRIMARY}
          fontSize={SVG_ICON_PROPS.FONT_SIZE.SMALL}
        />
      ) : (
        <Grid {...GRID_PROPS}>
          <Button
            {...BUTTON_PROPS.PRIMARY_CONTAINED}
            onClick={() => {
              setEnaQueryMethod(ENA_QUERY_METHOD.ACCESSION);
              onOpen();
            }}
          >
            Enter Accession(s)
          </Button>
          {readCount < MAX_READ_RUNS_FOR_BROWSE_ALL && (
            <Button
              {...BUTTON_PROPS.PRIMARY_CONTAINED}
              onClick={() => {
                setEnaQueryMethod(ENA_QUERY_METHOD.TAXONOMY_ID);
                onContinue();
              }}
            >
              {renderButtonText(readCount)}
            </Button>
          )}
        </Grid>
      )}
    </StyledPaper>
  );
};

/**
 * Renders the button text based on the read count.
 * @param readCount - The number of reads.
 * @returns The button text.
 */
function renderButtonText(readCount: number): string {
  if (readCount === 1) return "Browse 1 Sequence";
  return `Browse All ${readCount} Sequences`;
}
