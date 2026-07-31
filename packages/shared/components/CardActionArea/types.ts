import type { BaseComponentProps } from "@databiosphere/findable-ui/lib/components/types";
import type { CardActionAreaProps } from "@mui/material";

export interface Props
  extends BaseComponentProps, Pick<CardActionAreaProps, "children"> {
  href?: string;
}
