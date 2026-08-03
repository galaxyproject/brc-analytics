import { type ButtonProps } from "@mui/material";
import { type ReactNode } from "react";

export interface Props {
  className?: string;
  content: ReactNode;
  ctas: ButtonProps[];
  images: string[];
  steps: StepItem[];
}

interface StepItem {
  details?: string;
  title: string;
}
