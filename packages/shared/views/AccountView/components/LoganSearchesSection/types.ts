import type { UseUserResourceReturn } from "@repo/shared/hooks/UseUserResource/types";
import type { LoganSearchRecord } from "@repo/shared/services/api-client/types";

export interface Props {
  resource: UseUserResourceReturn<LoganSearchRecord>;
  // Searches the user has in all, of which `resource` holds the pages loaded
  // so far.
  total: number;
}
