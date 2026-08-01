import type { Breadcrumb } from "@databiosphere/findable-ui/lib/components/common/Breadcrumbs/breadcrumbs";
import type { BaseComponentProps } from "@databiosphere/findable-ui/lib/components/types";
import type { ReactNode } from "react";

export interface Props extends BaseComponentProps {
  breadcrumbs: Breadcrumb[];
  head: ReactNode;
  subHead: ReactNode;
}
