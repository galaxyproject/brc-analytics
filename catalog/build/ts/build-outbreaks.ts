import path from "path";
import { Outbreak } from "../../../sites/brc-analytics/apis/outbreak";
import {
  Outbreak as SourceOutbreak,
  Outbreaks as SourceOutbreaks,
} from "../../schema/generated/schema";
import {
  parseListOrNull,
  readMdxFile,
  readValuesFile,
  readYamlFile,
} from "./utils";

const TAXONOMY_MAPPING_KEYS = [
  "source_taxonomy_id",
  "taxonomy_id",
  "highlight_descendant_taxonomy_ids",
  "name",
  "rank",
] as const;

type TaxonomyMapping = Record<(typeof TAXONOMY_MAPPING_KEYS)[number], string>;

const SOURCE_PATH_ROOT = "catalog/source";
const SOURCE_PATH_OUTBREAKS = "catalog/source/outbreaks.yml";
const OUTBREAK_TAXONOMY_MAPPING_PATH =
  "catalog/build/intermediate/outbreak-taxonomy-mapping.tsv";

// Standard taxonomic ranks that are already captured in our data model
const STANDARD_TAXONOMIC_RANKS = [
  "domain",
  "realm",
  "kingdom",
  "phylum",
  "class",
  "order",
  "family",
  "genus",
  "species",
  "strain",
];

/**
 * Determine the best field to use for filtering assemblies/organisms based on an outbreak's taxonomy
 * @param outbreak - The outbreak object containing the taxonomy ID
 * @param taxonomyMappings - Array of taxonomy mappings to look up the taxonomy name and rank
 * @returns An object containing the field name and value to use for filtering, or null if no mapping is found
 */
function getTaxonomyInfo(
  sourceOutbreak: SourceOutbreak,
  taxonomyMappings: TaxonomyMapping[]
): Pick<
  Outbreak,
  | "taxonomy_id"
  | "highlight_descendant_taxonomy_ids"
  | "taxonName"
  | "taxonNameField"
> | null {
  // make sure is string
  const sourceTaxonomyId = String(sourceOutbreak.taxonomy_id);

  // Find the mapping for this taxonomy ID
  const mapping = taxonomyMappings.find(
    (m) => m.source_taxonomy_id === sourceTaxonomyId
  );
  if (!mapping) {
    return null;
  }

  const taxIdsInfo: Pick<
    Outbreak,
    "taxonomy_id" | "highlight_descendant_taxonomy_ids"
  > = {
    taxonomy_id: Number(mapping.taxonomy_id),
    highlight_descendant_taxonomy_ids:
      parseListOrNull(mapping.highlight_descendant_taxonomy_ids)?.map((id) =>
        Number(id)
      ) ?? null,
  };

  // If the rank is a standard taxonomic rank, use the corresponding taxonomic level field
  const rank = mapping.rank.toLowerCase();
  if (STANDARD_TAXONOMIC_RANKS.includes(rank)) {
    return {
      ...taxIdsInfo,
      taxonName: mapping.name,
      taxonNameField: `taxonomicLevel${rank.charAt(0).toUpperCase()}${rank.slice(1)}`,
    };
  }

  // If the rank is not a standard taxonomic rank, use otherTaxa
  return {
    ...taxIdsInfo,
    taxonName: mapping.name,
    taxonNameField: "otherTaxa",
  };
}

export async function buildOutbreaks(): Promise<Outbreak[]> {
  // Read the taxonomy mapping data
  let taxonomyMappings: TaxonomyMapping[] = [];

  try {
    taxonomyMappings = await readValuesFile<TaxonomyMapping>(
      OUTBREAK_TAXONOMY_MAPPING_PATH,
      undefined,
      TAXONOMY_MAPPING_KEYS
    );
    console.log(`Read ${taxonomyMappings.length} taxonomy mappings`);
  } catch (error) {
    console.warn("Could not read taxonomy mapping data:", error);
    // Continue with empty array if file doesn't exist yet
  }

  const { outbreaks: sourceOutbreaks } = await readYamlFile<SourceOutbreaks>(
    SOURCE_PATH_OUTBREAKS
  );
  const outbreaks: Outbreak[] = [];

  for (const sourceOutbreak of sourceOutbreaks) {
    if (!sourceOutbreak.active) continue;

    const descriptionPath = path.resolve(
      SOURCE_PATH_ROOT,
      sourceOutbreak.description.path
    );

    // Create the base outbreak object
    let outbreak: Outbreak = {
      description: await readMdxFile(descriptionPath),
      highlight_descendant_taxonomy_ids:
        sourceOutbreak.highlight_descendant_taxonomy_ids ?? null,
      name: sourceOutbreak.name,
      priority: sourceOutbreak.priority,
      resources: sourceOutbreak.resources,
      taxonomy_id: sourceOutbreak.taxonomy_id,
    };

    // Find the resolved taxonomy IDs, and determine the taxon field and name for filtering
    // If the relevant mapping entry doesn't exist, the taxonomy IDs are left as they are in the source,
    // and the taxon field info is omitted
    const taxonInfo = getTaxonomyInfo(sourceOutbreak, taxonomyMappings);
    if (taxonInfo) {
      outbreak = { ...outbreak, ...taxonInfo };
    }

    outbreaks.push(outbreak);
  }

  return outbreaks;
}
