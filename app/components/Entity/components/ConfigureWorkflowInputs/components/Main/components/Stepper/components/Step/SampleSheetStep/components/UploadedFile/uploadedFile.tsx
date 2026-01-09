import { IconButton, Stack, Typography } from "@mui/material";
import { StyledRoundedPaper } from "./uploadedFile.styles";
import { TYPOGRAPHY_PROPS } from "@databiosphere/findable-ui/lib/styles/common/mui/typography";
import { ICON_BUTTON_PROPS } from "@databiosphere/findable-ui/lib/styles/common/mui/iconButton";
import { SVG_ICON_PROPS } from "@databiosphere/findable-ui/lib/styles/common/mui/svgIcon";
import { FolderZipRounded } from "@mui/icons-material";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import { Props } from "./types";
import { formatFileSize } from "@databiosphere/findable-ui/lib/utils/formatFileSize";

export const UploadedFile = ({ file, onClear }: Props): JSX.Element | null => {
  if (!file) return null;
  return (
    <StyledRoundedPaper elevation={0}>
      <FolderZipRounded />
      <Stack flex={1} gap={1} useFlexGap>
        <Stack direction="row" gap={2} alignItems="center">
          <Typography noWrap variant={TYPOGRAPHY_PROPS.VARIANT.BODY_500}>
            {file.name}
          </Typography>
          <Typography
            color={TYPOGRAPHY_PROPS.COLOR.INK_LIGHT}
            variant={TYPOGRAPHY_PROPS.VARIANT.BODY_SMALL_400}
          >
            {formatFileSize(file.size)}
          </Typography>
        </Stack>
        <Typography
          color={TYPOGRAPHY_PROPS.COLOR.INK_LIGHT}
          variant={TYPOGRAPHY_PROPS.VARIANT.BODY_SMALL_400}
        >
          Completed
        </Typography>
      </Stack>
      <IconButton onClick={onClear} size={ICON_BUTTON_PROPS.SIZE.SMALL}>
        <DeleteRoundedIcon fontSize={SVG_ICON_PROPS.FONT_SIZE.SMALL} />
      </IconButton>
    </StyledRoundedPaper>
  );
};
