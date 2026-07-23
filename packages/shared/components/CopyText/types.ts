import type { GridProps } from "@mui/material";
import type { ReactNode } from "react";
import type { Props as ClipboardCopyProps } from "./components/ClipboardCopy/types";

export interface Props extends ClipboardCopyProps {
  children: ReactNode;
  gridProps?: Partial<GridProps>;
}
