import path from "path";
import { Outbreak } from "../../../app/apis/catalog/brc-analytics-catalog/common/entities";
import { Outbreaks as SourceOutbreaks } from "../../schema/generated/schema";
import { readMdxFile, readYamlFile } from "./utils";

const SOURCE_PATH_ROOT = "catalog/source";
const SOURCE_PATH_OUTBREAKS = "catalog/source/outbreaks.yml";

export async function buildOutbreaks(): Promise<Outbreak[]> {
  const { outbreaks: sourceOutbreaks } = await readYamlFile<SourceOutbreaks>(
    SOURCE_PATH_OUTBREAKS
  );
  const outbreaks: Outbreak[] = [];
  for (const sourceOutbreak of sourceOutbreaks) {
    const descriptionPath = path.resolve(
      SOURCE_PATH_ROOT,
      sourceOutbreak.description.path
    );
    outbreaks.push({
      active: sourceOutbreak.active,
      description: await readMdxFile(descriptionPath),
      highlight_descendant_taxonomy_ids:
        sourceOutbreak.highlight_descendant_taxonomy_ids ?? null,
      priority: sourceOutbreak.priority,
      resources: sourceOutbreak.resources,
      taxonomy_id: sourceOutbreak.taxonomy_id,
    });
  }
  return outbreaks;
}
