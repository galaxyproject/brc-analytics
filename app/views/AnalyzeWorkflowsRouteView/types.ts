import type { EntityKey } from "@/providers/workflowHandoff/types";

export interface Props {
  entityId: string;
  entityListType: EntityKey;
}
