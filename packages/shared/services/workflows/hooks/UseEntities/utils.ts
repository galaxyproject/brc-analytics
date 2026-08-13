import { type SiteConfig } from "@databiosphere/findable-ui/lib/config/entities";
import { DataExplorerError } from "@databiosphere/findable-ui/lib/types/error";
import { type EntitiesLoader } from "./types";

/**
 * Runs the entity/workflow cache load and reports the outcome to the caller.
 * A failure is also logged, so it stays visible in diagnostics even when no
 * consumer of the load state is mounted.
 * @param ensureEntitiesLoaded - Loader that resolves once the entities and workflows are loaded.
 * @param config - Site config.
 * @param onLoaded - Called with true when the load succeeds.
 * @param onError - Called with the coerced error when the load fails, and with
 * undefined when it succeeds, so a stale error from an earlier attempt never
 * outlives a successful load.
 * @returns Promise that resolves once the outcome has been reported.
 */
export async function runEntitiesLoad(
  ensureEntitiesLoaded: EntitiesLoader,
  config: SiteConfig,
  onLoaded: (isLoaded: boolean) => void,
  onError: (error?: DataExplorerError) => void
): Promise<void> {
  try {
    await ensureEntitiesLoaded(config);
    onError(undefined);
    onLoaded(true);
  } catch (error) {
    const dataExplorerError = toDataExplorerError(error);
    console.error("Failed to load entities:", dataExplorerError);
    onError(dataExplorerError);
  }
}

/**
 * Coerces an unknown rejection value into a DataExplorerError. Guards against
 * non-Error rejection reasons, which the DataExplorerError constructor cannot
 * take directly, and passes an existing DataExplorerError through unchanged so
 * its request fields aren't dropped by re-wrapping.
 * @param value - Rejection value.
 * @returns DataExplorerError wrapping the value.
 */
export function toDataExplorerError(value: unknown): DataExplorerError {
  if (value instanceof DataExplorerError) return value;
  return new DataExplorerError(
    value instanceof Error ? value : new Error(String(value))
  );
}
