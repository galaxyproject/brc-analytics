import { JSX } from "react";

export interface Props {
  children: (height?: number, width?: number) => JSX.Element;
  className?: string;
}
