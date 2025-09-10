import { SouthIcon } from "@databiosphere/findable-ui/lib/components/common/CustomIcon/components/SouthIcon/southIcon";
import { SwipeAction } from "../../../../../../../../../../../hooks/useSwipeInteraction/common/entities";
import { IconButton } from "./arrow.styles";

interface ArrowProps {
  onClick: () => void;
  swipeAction: SwipeAction;
}

export const Arrow = ({ onClick, swipeAction }: ArrowProps): JSX.Element => {
  return (
    <IconButton
      color="secondary"
      onClick={onClick}
      size="large"
      swipeAction={swipeAction}
    >
      <SouthIcon fontSize="small" />
    </IconButton>
  );
};
