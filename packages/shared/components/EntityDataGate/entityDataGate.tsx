import { Error } from "@databiosphere/findable-ui/lib/components/Error/error";
import { getConfig } from "@databiosphere/findable-ui/lib/config/config";
import { useEntitiesState } from "@repo/shared/providers/entities/hook";
import { type JSX } from "react";
import type { Props } from "./types";

/**
 * Gate page-level content on the workflows entity cache being loaded.
 * Renders `fallback` (default `null`) until loaded, then `children`. A
 * failed cache load renders the error page in place of the gated content
 * — only on gated pages, and without involving the app error boundary,
 * so pages that don't depend on the cache (and client-side navigation to
 * them) are unaffected. Applied per-page — a global gate would
 * short-circuit SSG for every route. Reads the load state from the
 * EntitiesProvider at app root, so mounting a gate doesn't restart the
 * loading lifecycle or flash a fallback when the cache is already
 * populated.
 * @param props - Component props.
 * @param props.children - Content to render once entities are loaded.
 * @param props.fallback - Optional placeholder while loading. Defaults to null.
 * @returns Children when loaded, the error page on a failed load, fallback otherwise.
 */
export function EntityDataGate({
  children,
  fallback = null,
}: Props): JSX.Element {
  const { error, isLoaded } = useEntitiesState();
  if (isLoaded) return <>{children}</>;
  if (error)
    return (
      <Error
        errorMessage={error.message}
        requestUrlMessage={error.requestUrlMessage}
        rootPath={getConfig().redirectRootToPath}
      />
    );
  return <>{fallback}</>;
}
