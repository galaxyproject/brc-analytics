import { type BaseComponentProps } from "@databiosphere/findable-ui/lib/components/types";
import { type ReactNode } from "react";

export interface Props extends BaseComponentProps {
  children: ReactNode | ReactNode[];
}
