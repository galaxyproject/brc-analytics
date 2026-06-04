import { JSX } from "react";
import { useEntitiesLoaded } from "../../providers/entitiesLoaded/hook";
import { EntityDataGateProps } from "./types";

/**
 * Gate page-level content on the workflows entity cache being loaded.
 * Renders `fallback` (default `null`) until loaded, then `children`.
 * Applied per-page — a global gate would short-circuit SSG for every
 * route. Reads the loaded boolean from the EntitiesLoadedProvider at
 * app root, so mounting a gate doesn't restart the loading lifecycle
 * or flash a fallback when the cache is already populated.
 * @param props - Component props.
 * @param props.children - Content to render once entities are loaded.
 * @param props.fallback - Optional placeholder while loading. Defaults to null.
 * @returns Children when loaded, fallback otherwise.
 */
export function EntityDataGate({
  children,
  fallback = null,
}: EntityDataGateProps): JSX.Element {
  const isLoaded = useEntitiesLoaded();
  return <>{isLoaded ? children : fallback}</>;
}
