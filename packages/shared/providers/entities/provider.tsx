import { type JSX } from "react";
import { EntitiesContext } from "./context";
import type { Props } from "./types";

/**
 * Distributes the workflows-entity-cache load state to descendants.
 * Mounted at app root so the value persists across client-side page
 * navigations — once entities are loaded, gated pages render their
 * content on the first render (no useState(false) reset / flicker).
 * @param props - Component props.
 * @param props.children - Subtree to provide the value to.
 * @param props.value - Current load state.
 * @returns Context provider element.
 */
export function EntitiesProvider({ children, value }: Props): JSX.Element {
  return (
    <EntitiesContext.Provider value={value}>
      {children}
    </EntitiesContext.Provider>
  );
}
