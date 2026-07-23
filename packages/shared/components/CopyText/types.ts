import type { GridProps } from "@mui/material";
import type { ComponentProps, ReactNode } from "react";
import { ClipboardCopy } from "./components/ClipboardCopy/clipboardCopy";

export interface Props extends ComponentProps<typeof ClipboardCopy> {
  children: ReactNode;
  gridProps?: Partial<GridProps>;
}
