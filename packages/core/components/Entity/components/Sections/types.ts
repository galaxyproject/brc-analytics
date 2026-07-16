import {
  BaseComponentProps,
  ChildrenProps,
} from "@databiosphere/findable-ui/lib/components/types";
import { PaperProps } from "@mui/material";
import { ComponentType } from "react";

export interface SectionsProps extends BaseComponentProps, ChildrenProps {
  Paper?: ComponentType<PaperProps>;
}
