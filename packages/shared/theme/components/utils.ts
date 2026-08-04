import {
  type Components,
  type ComponentsVariants,
  type CSSObject,
} from "@mui/material";

/**
 * A component's `styleOverrides` object, keyed by slot.
 */
type StyleOverrides<K extends keyof Components> =
  NonNullable<Components[K]> extends { styleOverrides?: infer S }
    ? NonNullable<S>
    : never;

/**
 * A single `root` style-override variant for a component. MUI types component
 * variant entries via `ComponentsVariants`, but the `styleOverrides.root` slot
 * expects the stricter `CSSObject` style, so the style member is narrowed here.
 */
type RootVariant<K extends keyof Components> = Omit<
  NonNullable<ComponentsVariants[K & keyof ComponentsVariants]>[number],
  "style"
> & { style: CSSObject };

/**
 * The object form of a component's `root` slot. MUI types the slot as an opaque
 * Interpolation; this narrows it to the CSSObject-with-variants shape it takes at
 * runtime so the variants can be read and extended.
 */
type Root<K extends keyof Components> = CSSObject & {
  variants?: RootVariant<K>[];
};

/**
 * Reads the `styleOverrides` object off a component theme override.
 * @param component - Component theme override.
 * @returns The component's style overrides, or an empty object.
 */
export function extractStyleOverrides<K extends keyof Components>(
  component: Components[K]
): StyleOverrides<K> {
  const empty = {} as StyleOverrides<K>;
  if (!component || typeof component !== "object") return empty;
  const styleOverrides = (component as { styleOverrides?: unknown })
    .styleOverrides;
  if (!styleOverrides || typeof styleOverrides !== "object") return empty;
  return styleOverrides as StyleOverrides<K>;
}

/**
 * Reads the `root` slot off a component theme override. MUI types the slot as an
 * opaque Interpolation, so it is recovered here behind runtime guards.
 * @param component - Component theme override.
 * @returns The component's root slot, or an empty object.
 */
export function extractRoot<K extends keyof Components>(
  component: Components[K]
): Root<K> {
  const styleOverrides = extractStyleOverrides(component) as Record<
    string,
    unknown
  >;
  const root = styleOverrides.root;
  if (!root || typeof root !== "object") return {} as Root<K>;
  return root as Root<K>;
}

/**
 * Reads the root style-override variants off a component theme override, returned
 * typed so a site can concatenate its own variants onto them.
 * @param component - Component theme override.
 * @returns The component's root style-override variants, or an empty array.
 */
export function extractVariants<K extends keyof Components>(
  component: Components[K]
): RootVariant<K>[] {
  return extractRoot(component).variants ?? [];
}
