import { replaceParameters } from "@databiosphere/findable-ui/lib/utils/replaceParameters";
import { formatTrsId } from "@repo/shared/workflow/utils";

/**
 * Builds a configure-workflow URL from a pure path template, appending the
 * workflow TRS ID as a query parameter. The TRS ID is normalized to catalog
 * format via `formatTrsId` (non-alphanumerics become `-`), then URL-encoded —
 * raw values are not preserved verbatim.
 * @param route - Path template with an `{entityId}` parameter.
 * @param entityId - Entity ID.
 * @param trsId - Workflow TRS ID (raw or already catalog-formatted).
 * @returns Configure-workflow URL.
 */
export function buildConfigureWorkflowUrl(
  route: string,
  entityId: string,
  trsId: string
): string {
  const searchParams = new URLSearchParams({ trsId: formatTrsId(trsId) });
  return `${replaceParameters(route, { entityId })}?${searchParams}`;
}
