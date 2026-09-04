import type { FavoriteEntityType } from "@repo/shared/providers/favorites/types";

export interface Props {
  entityId: string;
  entityType: FavoriteEntityType;
}
