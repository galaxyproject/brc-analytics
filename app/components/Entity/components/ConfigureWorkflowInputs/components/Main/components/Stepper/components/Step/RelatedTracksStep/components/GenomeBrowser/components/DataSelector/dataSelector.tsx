import { Button, Stack, Typography } from "@mui/material";
import { StyledPaper } from "./dataSelector.styles";
import { TYPOGRAPHY_PROPS } from "@databiosphere/findable-ui/lib/styles/common/mui/typography";
import { PAPER_PROPS } from "./constants";
import { BUTTON_PROPS } from "@databiosphere/findable-ui/lib/components/common/Button/constants";
import { LoadingIcon } from "@databiosphere/findable-ui/lib/components/common/CustomIcon/components/LoadingIcon/loadingIcon";
import { SVG_ICON_PROPS } from "@databiosphere/findable-ui/lib/styles/common/mui/svgIcon";
import { Props } from "./types";

export const DataSelector = ({
  loading,
  onContinue,
  selectedCount,
  tracksCount,
}: Props): JSX.Element | null => {
  if (selectedCount > 0) return null;
  return (
    <StyledPaper {...PAPER_PROPS}>
      <Stack spacing={2}>
        <Typography
          component="div"
          variant={TYPOGRAPHY_PROPS.VARIANT.HEADING_XSMALL}
        >
          Select Related Tracks
        </Typography>
        <Typography
          color={TYPOGRAPHY_PROPS.COLOR.INK_LIGHT}
          variant={TYPOGRAPHY_PROPS.VARIANT.BODY_400}
        >
          Browse UCSC Genome Browser to find and select related tracks
        </Typography>
      </Stack>
      {loading ? (
        <LoadingIcon
          color={SVG_ICON_PROPS.COLOR.PRIMARY}
          fontSize={SVG_ICON_PROPS.FONT_SIZE.SMALL}
        />
      ) : (
        <Button
          {...BUTTON_PROPS.PRIMARY_CONTAINED}
          disabled={!tracksCount}
          onClick={onContinue}
        >
          {renderButtonText(tracksCount)}
        </Button>
      )}
    </StyledPaper>
  );
};

/**
 * Renders the button text based on the count.
 * @param count - Count.
 * @returns The button text.
 */
function renderButtonText(count?: number): string {
  if (count === undefined) return "Browse Tracks";
  if (count === 1) return "Browse 1 Track";
  return `Browse ${count} Tracks`;
}
