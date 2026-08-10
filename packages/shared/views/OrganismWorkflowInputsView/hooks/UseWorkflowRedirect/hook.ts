import { replaceParameters } from "@databiosphere/findable-ui/lib/utils/replaceParameters";
import { ROUTES } from "@repo/shared/routes/constants";
import { getTrsId } from "@repo/shared/workflow/utils";
import Router, { useRouter } from "next/router";
import { useEffect } from "react";

/**
 * Resolves the selected workflow from the query; when the router is ready and no
 * workflow is selected, redirects to the entity's detail page. Returns the
 * resolved TRS ID (undefined before the router is ready or while redirecting) so
 * the caller can gate rendering on it.
 * @param entityId - Entity ID used to build the redirect target.
 * @returns The resolved TRS ID, or undefined.
 */
export function useWorkflowRedirect(entityId: string): string | undefined {
  const { isReady, query } = useRouter();
  const trsId = getTrsId(query);
  const shouldRedirect = isReady && !trsId;

  useEffect(() => {
    if (shouldRedirect) {
      Router.replace(replaceParameters(ROUTES.ORGANISM, { entityId }));
    }
  }, [entityId, shouldRedirect]);

  return trsId;
}
