import { Breadcrumb } from "@databiosphere/findable-ui/lib/components/common/Breadcrumbs/breadcrumbs";
import { BaseComponentProps } from "@databiosphere/findable-ui/lib/components/types";
import { ReactNode } from "react";

export interface Props extends BaseComponentProps {
  breadcrumbs: Breadcrumb[];
  head: ReactNode;
  subHead: ReactNode;
}
