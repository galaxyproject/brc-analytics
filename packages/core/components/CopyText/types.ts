import { GridProps } from "@mui/material";
import { ComponentProps, ReactNode } from "react";
import { ClipboardCopy } from "./components/ClipboardCopy/clipboardCopy";

export interface Props extends ComponentProps<typeof ClipboardCopy> {
  children: ReactNode;
  gridProps?: Partial<GridProps>;
}
