import { JSX } from "react";
import { useEntities } from "../../services/workflows/hooks/UseEntities/hook";
import { EntityDataGateProps } from "./types";

/**
 * Gate page-level content on the workflows entity cache being loaded.
 * Renders `fallback` (default `null`) until loaded, then `children`.
 * Applied per-page — a global gate would short-circuit SSG for every
 * route.
 * @param props - Component props.
 * @param props.children - Content to render once entities are loaded.
 * @param props.fallback - Optional placeholder while loading. Defaults to null.
 * @returns Children when loaded, fallback otherwise.
 */
export function EntityDataGate({
  children,
  fallback = null,
}: EntityDataGateProps): JSX.Element {
  const isLoaded = useEntities();
  return <>{isLoaded ? children : fallback}</>;
}
