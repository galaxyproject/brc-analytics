import { type API } from "./routes";

export type EntityRoute = keyof typeof API;

// Store key: the shared entity routes plus any site-specific keys a site's
// loader stashes in the shared cache. `(string & {})` keeps EntityRoute
// autocomplete while still admitting other string keys.
export type EntityStoreKey = EntityRoute | (string & {});
