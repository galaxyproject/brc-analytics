import type { UseUserResourceReturn } from "@repo/shared/hooks/UseUserResource/types";
import type { SavedAnalysisSummary } from "@repo/shared/services/api-client/types";

export interface Props {
  resource: UseUserResourceReturn<SavedAnalysisSummary>;
}
