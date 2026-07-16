import { useRouter } from "next/router";
import { normalizePagePath } from "./utils";

/**
 * Current page pathname in canonical form — query string, fragment, and
 * trailing slash stripped. Used as the key for any page-scoped state lookups
 * (e.g. the assistant handoff cell). The dispatch site (e.g. `SchemaPanel`)
 * normalises through the same helper so both sides stay in sync.
 * @returns Canonical pathname.
 */
export const useCurrentPath = (): string => {
  const { asPath } = useRouter();
  return normalizePagePath(asPath);
};
