import { type ChipProps } from "@mui/material";

type ChipPropsOptions = {
  COLOR: typeof COLOR;
};

const COLOR: Record<string, ChipProps["color"]> = {
  ALERT: "alert",
  NONE: "none",
};

export const CHIP_PROPS: ChipPropsOptions = {
  COLOR,
};
