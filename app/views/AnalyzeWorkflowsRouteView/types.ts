import type { EntityKey } from "@repo/shared/providers/workflowHandoff/types";

export interface Props {
  entityId: string;
  entityListType: EntityKey;
}
