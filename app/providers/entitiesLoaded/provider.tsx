import { JSX } from "react";
import { EntitiesLoadedContext } from "./context";
import { EntitiesLoadedProviderProps } from "./types";

/**
 * Distributes the workflows-entity-cache loaded boolean to descendants.
 * Mounted at app root so the value persists across client-side page
 * navigations — once entities are loaded, gated pages render their
 * content on the first render (no useState(false) reset / flicker).
 * @param props - Component props.
 * @param props.children - Subtree to provide the value to.
 * @param props.value - Current loaded state.
 * @returns Context provider element.
 */
export function EntitiesLoadedProvider({
  children,
  value,
}: EntitiesLoadedProviderProps): JSX.Element {
  return (
    <EntitiesLoadedContext.Provider value={value}>
      {children}
    </EntitiesLoadedContext.Provider>
  );
}
