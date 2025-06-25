import { ChipProps } from "@mui/material";

type ChipPropsOptions = {
  COLOR: typeof COLOR;
};

const COLOR: Record<string, ChipProps["color"]> = {
  ALERT: "alert",
  CAUTION: "caution",
};

export const CHIP_PROPS: ChipPropsOptions = {
  COLOR,
};
