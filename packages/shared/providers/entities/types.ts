import { type UseEntities } from "@repo/shared/services/workflows/hooks/UseEntities/types";
import { type ReactNode } from "react";

export interface Props {
  children: ReactNode;
  value: UseEntities;
}
