import { Button, Divider, Stack, Typography } from "@mui/material";
import { StyledPaper, StyledGrid } from "./dataSelector.styles";
import { TYPOGRAPHY_PROPS } from "@databiosphere/findable-ui/lib/styles/common/mui/typography";
import { GRID_PROPS, PAPER_PROPS } from "./constants";
import { BUTTON_PROPS } from "@databiosphere/findable-ui/lib/components/common/Button/constants";
import { LoadingIcon } from "@databiosphere/findable-ui/lib/components/common/CustomIcon/components/LoadingIcon/loadingIcon";
import { SVG_ICON_PROPS } from "@databiosphere/findable-ui/lib/styles/common/mui/svgIcon";
import { Props } from "./types";
import { ENA_QUERY_METHOD } from "../../../../types";
import { Fragment } from "react";

export const DataSelector = ({
  enaTaxonomyIdStatus,
  onContinue,
  onOpen,
  readCount,
  selectedCount,
  setEnaQueryMethod,
  taxonomicLevelSpecies,
}: Props): JSX.Element | null => {
  if (selectedCount > 0) return null;
  return (
    <StyledPaper {...PAPER_PROPS}>
      <Stack spacing={2}>
        <Typography
          component="div"
          variant={TYPOGRAPHY_PROPS.VARIANT.HEADING_XSMALL}
        >
          Select sequences from ENA
        </Typography>
        <Typography
          color={TYPOGRAPHY_PROPS.COLOR.INK_LIGHT}
          variant={TYPOGRAPHY_PROPS.VARIANT.BODY_400}
        >
          Browse ENA to find and select sequences
        </Typography>
      </Stack>
      {enaTaxonomyIdStatus.loading ? (
        <LoadingIcon
          color={SVG_ICON_PROPS.COLOR.PRIMARY}
          fontSize={SVG_ICON_PROPS.FONT_SIZE.SMALL}
        />
      ) : (
        <StyledGrid {...GRID_PROPS}>
          {enaTaxonomyIdStatus.eligible && (
            <Fragment>
              <Stack alignItems="center" spacing={1}>
                <Button
                  {...BUTTON_PROPS.PRIMARY_CONTAINED}
                  onClick={() => {
                    setEnaQueryMethod(ENA_QUERY_METHOD.TAXONOMY_ID);
                    onContinue();
                  }}
                >
                  {renderButtonText(readCount)}
                </Button>
                <Typography
                  color={TYPOGRAPHY_PROPS.COLOR.INK_LIGHT}
                  noWrap
                  maxWidth={200}
                  variant={TYPOGRAPHY_PROPS.VARIANT.BODY_400}
                >
                  {taxonomicLevelSpecies}
                </Typography>
              </Stack>
              <Divider flexItem orientation="vertical">
                <Typography
                  component="div"
                  color={TYPOGRAPHY_PROPS.COLOR.INK_LIGHT}
                  variant={TYPOGRAPHY_PROPS.VARIANT.BODY_400}
                >
                  <i>OR</i>
                </Typography>
              </Divider>
            </Fragment>
          )}
          <Stack alignItems="center" spacing={1}>
            <Button
              {...BUTTON_PROPS.PRIMARY_CONTAINED}
              onClick={() => {
                setEnaQueryMethod(ENA_QUERY_METHOD.ACCESSION);
                onOpen();
              }}
            >
              Enter Accession(s)
            </Button>
            <Typography
              color={TYPOGRAPHY_PROPS.COLOR.INK_LIGHT}
              variant={TYPOGRAPHY_PROPS.VARIANT.BODY_400}
            >
              Any organism
            </Typography>
          </Stack>
        </StyledGrid>
      )}
    </StyledPaper>
  );
};

/**
 * Renders the button text based on the read count.
 * @param readCount - The number of reads.
 * @returns The button text.
 */
function renderButtonText(readCount: number | undefined): string {
  if (!readCount) return "No Sequences";
  if (readCount === 1) return "Browse 1 Sequence";
  return `Browse ${readCount} Sequences`;
}
