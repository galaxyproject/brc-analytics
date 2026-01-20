import { IconButton, Stack, Typography } from "@mui/material";
import { StyledRoundedPaper } from "./uploadedFile.styles";
import { TYPOGRAPHY_PROPS } from "@databiosphere/findable-ui/lib/styles/common/mui/typography";
import { ICON_BUTTON_PROPS } from "@databiosphere/findable-ui/lib/styles/common/mui/iconButton";
import { SVG_ICON_PROPS } from "@databiosphere/findable-ui/lib/styles/common/mui/svgIcon";
import { FolderZipRounded } from "@mui/icons-material";
import { Props } from "./types";
import { formatFileSize } from "@databiosphere/findable-ui/lib/utils/formatFileSize";
import { DeleteIcon } from "../../../../../../../../../../../../common/CustomIcon/components/DeleteIcon/deleteIcon";
import { ScanDeleteIcon } from "../../../../../../../../../../../../common/CustomIcon/components/ScanDeleteIcon/scanDeleteIcon";
import { ReactNode } from "react";

export const UploadedFile = ({
  errors = [],
  file,
  onClear,
}: Props): JSX.Element | null => {
  if (!file) return null;
  return (
    <StyledRoundedPaper elevation={0} error={errors.length > 0}>
      {renderIcon(errors)}
      <Stack flex={1} gap={1} useFlexGap sx={{ minWidth: 0 }}>
        <Stack direction="row" gap={2} alignItems="center">
          <Typography noWrap variant={TYPOGRAPHY_PROPS.VARIANT.BODY_500}>
            {file.name}
          </Typography>
          <Typography
            color={TYPOGRAPHY_PROPS.COLOR.INK_LIGHT}
            noWrap
            variant={TYPOGRAPHY_PROPS.VARIANT.BODY_SMALL_400}
          >
            {formatFileSize(file.size)}
          </Typography>
        </Stack>
        <Typography
          color={TYPOGRAPHY_PROPS.COLOR.INK_LIGHT}
          variant={TYPOGRAPHY_PROPS.VARIANT.BODY_SMALL_400}
        >
          {renderText(errors)}
        </Typography>
      </Stack>
      <IconButton
        aria-label="Remove uploaded file"
        onClick={onClear}
        size={ICON_BUTTON_PROPS.SIZE.SMALL}
      >
        <DeleteIcon fontSize={SVG_ICON_PROPS.FONT_SIZE.SMALL} />
      </IconButton>
    </StyledRoundedPaper>
  );
};

/**
 * Renders the icon based on the validation errors.
 * @param errors - The validation errors.
 * @returns The icon element.
 */
function renderIcon(errors: string[]): ReactNode {
  if (errors.length === 0) return <FolderZipRounded />;

  return (
    <ScanDeleteIcon
      color={SVG_ICON_PROPS.COLOR.ERROR}
      fontSize={SVG_ICON_PROPS.FONT_SIZE.MEDIUM}
    />
  );
}

/**
 * Renders the text based on the validation errors.
 * @param errors - The validation errors.
 * @returns The text element.
 */
function renderText(errors: string[]): ReactNode {
  if (errors.length === 0) return "Completed";

  return (
    <ul>
      {errors.map((error) => (
        <li key={error}>{error}</li>
      ))}
    </ul>
  );
}
