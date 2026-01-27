import { JSX } from "react";
import ContentCopyRoundedIcon from "@mui/icons-material/ContentCopyRounded";
import { IconButton, Tooltip, TooltipProps } from "@mui/material";
import copy from "copy-to-clipboard";
import { useCallback, useEffect, useState } from "react";
import { ICON_BUTTON_PROPS, ICON_PROPS, TOOLTIP_PROPS } from "./constants";

export interface CopyToClipboardProps {
  timeoutDelay?: number;
  tooltipProps?: Partial<TooltipProps>;
  value: boolean | number | string;
}

export const ClipboardCopy = ({
  timeoutDelay = 2000,
  tooltipProps,
  value,
}: CopyToClipboardProps): JSX.Element => {
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
