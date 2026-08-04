import {
  type BaseComponentProps,
  type ChildrenProps,
} from "@databiosphere/findable-ui/lib/components/types";
import { type PaperProps } from "@mui/material";
import { type ComponentType } from "react";

export interface SectionsProps extends BaseComponentProps, ChildrenProps {
  Paper?: ComponentType<PaperProps>;
}
