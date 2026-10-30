import { Error } from "@databiosphere/findable-ui/lib/components/Error/error";
import { getConfig } from "@databiosphere/findable-ui/lib/config/config";
import { useEntityLists } from "@repo/shared/services/workflows/hooks/UseEntityLists/hook";
import { type JSX } from "react";
import type { Props } from "./types";

/**
 * Gate page-level content on the entity lists the page reads being loaded.
 * Loads those lists (and only those), rendering `fallback` (default `null`)
 * until every one of them is loaded, then `children`. A failed load of one of
 * them renders the error page in place of the gated content — without
 * involving the app error boundary, so pages that don't read that list (and
 * client-side navigation to them) are unaffected. Applied per-page — a global
 * gate would short-circuit SSG for every route. Lists already loaded by an
 * earlier page are kept, so the gate renders its content straight away when
 * returning to a page.
 * @param props - Component props.
 * @param props.children - Content to render once the page's lists are loaded.
 * @param props.fallback - Optional placeholder while loading. Defaults to null.
 * @param props.routes - Entity lists the page reads.
 * @returns Children when loaded, the error page on a failed load, fallback otherwise.
 */
export function EntityDataGate({
  children,
  fallback = null,
  routes,
}: Props): JSX.Element {
  const { error, isLoaded } = useEntityLists(routes);
  if (isLoaded) return <>{children}</>;
  if (error)
    return (
      <Error
        errorMessage={error.message}
        requestUrlMessage={error.requestUrlMessage}
        rootPath={getConfig()?.redirectRootToPath}
      />
    );
  return <>{fallback}</>;
}
