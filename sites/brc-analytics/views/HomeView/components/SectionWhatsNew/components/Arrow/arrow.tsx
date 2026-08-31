import { BackArrowIcon } from "@databiosphere/findable-ui/lib/components/common/CustomIcon/components/BackArrowIcon/backArrowIcon";
import { ForwardArrowIcon } from "@databiosphere/findable-ui/lib/components/common/CustomIcon/components/ForwardArrowIcon/forwardArrowIcon";
import { SVG_ICON_PROPS } from "@databiosphere/findable-ui/lib/styles/common/mui/svgIcon";
import { type JSX } from "react";
import { StyledIconButton } from "./arrow.styles";
import { ARROW_DIRECTION, type Props } from "./types";

export const Arrow = ({ direction, disabled, onClick }: Props): JSX.Element => {
  const isBack = direction === ARROW_DIRECTION.BACK;
  return (
    <StyledIconButton
      aria-label={isBack ? "Show previous updates" : "Show more updates"}
      disabled={disabled}
      onClick={onClick}
    >
      {isBack ? (
        <BackArrowIcon fontSize={SVG_ICON_PROPS.FONT_SIZE.SMALL} />
      ) : (
        <ForwardArrowIcon fontSize={SVG_ICON_PROPS.FONT_SIZE.SMALL} />
      )}
    </StyledIconButton>
  );
};
