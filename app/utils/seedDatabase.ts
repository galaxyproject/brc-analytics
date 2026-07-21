import type { EntityConfig } from "@databiosphere/findable-ui/lib/config/entities";
import { database } from "@databiosphere/findable-ui/lib/utils/database";
import fsp from "fs/promises";

// The catalog files are immutable for the lifetime of a build (generated before
// the static export) and findable-ui's `database` is a module-level singleton,
// so re-reading and re-seeding is pure waste. getStaticProps calls seedDatabase
// once per page — thousands of detail pages, rendered in parallel — so memoize
// the in-flight seed promise per entity type: every call after the first shares
// the single read/parse/seed instead of re-parsing the multi-MB catalog (or
// racing it).
const seedPromises = new Map<string, Promise<void>>();

/**
 * Read the configured catalog JSON and seed the database for an entity type.
 * @param entityListType - Entity list type.
 * @param entityConfig - Entity config.
 * @returns Promise<void>.
 */
async function doSeedDatabase(
  entityListType: string,
  entityConfig: EntityConfig
): Promise<void> {
  const { entityMapper, label, staticLoadFile } = entityConfig;

  if (!staticLoadFile) {
    throw new Error(`staticLoadFile not found for entity ${label}`);
  }

  // Build database from configured JSON, if any.
  let jsonText;
  try {
    jsonText = await fsp.readFile(staticLoadFile, "utf8");
  } catch {
    throw new Error(`File ${staticLoadFile} not found for entity ${label}`);
  }

  const object = JSON.parse(jsonText);
  const entities = entityMapper
    ? Object.values(object).map(entityMapper)
    : Object.values(object); // Client-side fetched entities are mapped prior to dispatch to explore state.

  // Seed entities.
  database.get().seed(entityListType, entities);
}

/**
 * Seed database, memoized per entity type for the lifetime of the process.
 * @param entityListType - Entity list type.
 * @param entityConfig - Entity config.
 * @returns Promise<void>.
 */
export function seedDatabase(
  entityListType: string,
  entityConfig: EntityConfig
): Promise<void> {
  let seedPromise = seedPromises.get(entityListType);
  if (!seedPromise) {
    // Don't cache a failed read — evict on rejection, but re-throw so awaiters
    // (and unhandled-rejection tracking) still see the failure.
    seedPromise = doSeedDatabase(entityListType, entityConfig).catch(
      (error: unknown) => {
        seedPromises.delete(entityListType);
        throw error;
      }
    );
    seedPromises.set(entityListType, seedPromise);
  }
  return seedPromise;
}
