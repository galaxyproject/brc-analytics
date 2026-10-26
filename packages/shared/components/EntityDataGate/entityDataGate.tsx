import { Error } from "@databiosphere/findable-ui/lib/components/Error/error";
import { getConfig } from "@databiosphere/findable-ui/lib/config/config";
import { useEntitiesState } from "@repo/shared/providers/entities/hook";
import { type JSX } from "react";
import type { Props } from "./types";
import { getLoadState } from "./utils";

/**
 * Gate page-level content on the entity lists the page reads being loaded.
 * Renders `fallback` (default `null`) until every list in `routes` is loaded,
 * then `children`, so the page never waits on lists it doesn't read. A failed
 * load of one of those lists, or one the site's loader never started, renders
 * the error page in place of the gated content — only on gated pages that read that list, and without involving
 * the app error boundary, so pages that don't depend on it (and client-side
 * navigation to them) are unaffected. Applied per-page — a global gate would
 * short-circuit SSG for every route. Reads the load state from the
 * EntitiesProvider at app root, so mounting a gate doesn't restart the
 * loading lifecycle or flash a fallback when the lists are already loaded.
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
  const entities = useEntitiesState();
  const { error, isLoaded } = getLoadState(entities, routes);
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
