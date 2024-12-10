import { EntityConfig } from "@databiosphere/findable-ui/lib/config/entities";
import { database } from "@databiosphere/findable-ui/lib/utils/database";
import fsp from "fs/promises";

/**
 * Seed database.
 * @param entityListType - Entity list type.
 * @param entityConfig - Entity config.
 * @returns Promise<void>.
 */
export const seedDatabase = async function seedDatabase(
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
};
