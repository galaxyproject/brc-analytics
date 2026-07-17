import ContentCopyRoundedIcon from "@mui/icons-material/ContentCopyRounded";
import { IconButton, Tooltip } from "@mui/material";
import copy from "copy-to-clipboard";
import { JSX, useCallback, useEffect, useState } from "react";
import { ICON_BUTTON_PROPS, ICON_PROPS, TOOLTIP_PROPS } from "./constants";
import { Props } from "./types";

export const ClipboardCopy = ({
  timeoutDelay = 2000,
  tooltipProps,
  value,
}: Props): JSX.Element => {
  const [open, setOpen] = useState<boolean>(false);

  const onCopy = useCallback((): void => {
    copy(value.toString());
    setOpen(true);
  }, [value]);

  useEffect(() => {
    if (open) {
      const timeout = setTimeout(() => setOpen(false), timeoutDelay);
      return (): void => clearTimeout(timeout);
    }
  }, [open, timeoutDelay]);

  return (
    <Tooltip {...TOOLTIP_PROPS} open={open} {...tooltipProps}>
      <IconButton {...ICON_BUTTON_PROPS} onClick={onCopy}>
        <ContentCopyRoundedIcon {...ICON_PROPS} />
      </IconButton>
    </Tooltip>
  );
};
