import { CHIP_PROPS } from "@databiosphere/findable-ui/lib/styles/common/mui/chip";
import { type JSX } from "react";
import { StyledBetaChip } from "./beta.styles";

export const Beta = (): JSX.Element => {
  return <StyledBetaChip color={CHIP_PROPS.COLOR.INFO} label="Beta" />;
};
