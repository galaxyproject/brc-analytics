import path from "path";
import { type Outbreak } from "../../../sites/brc-analytics/apis/outbreak";
import {
  type Outbreak as SourceOutbreak,
  type Outbreaks as SourceOutbreaks,
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
 * Get an outbreak's resolved taxonomy IDs, along with the best field to use for filtering assemblies/organisms based on its taxonomy
 * @param sourceOutbreak - The source outbreak containing the taxonomy ID to look up
 * @param taxonomyMappings - Array of taxonomy mappings to look up the resolved taxonomy IDs, name and rank
 * @returns An object containing the resolved taxonomy IDs and the field name and value to use for filtering, or null if no mapping is found
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

  // Use the corresponding taxonomic level field for a standard taxonomic rank, and otherTaxa for anything else
  const rank = mapping.rank.toLowerCase();
  return {
    highlight_descendant_taxonomy_ids:
      parseListOrNull(mapping.highlight_descendant_taxonomy_ids)?.map((id) =>
        Number(id)
      ) ?? null,
    taxonName: mapping.name,
    taxonNameField: STANDARD_TAXONOMIC_RANKS.includes(rank)
      ? `taxonomicLevel${rank.charAt(0).toUpperCase()}${rank.slice(1)}`
      : "otherTaxa",
    taxonomy_id: Number(mapping.taxonomy_id),
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

    // Create the outbreak object, overlaying the resolved taxonomy IDs and the taxon field and name for filtering.
    // If the relevant mapping entry doesn't exist, the taxonomy IDs are left as they are in the source,
    // and the taxon field info is omitted
    const outbreak: Outbreak = {
      description: await readMdxFile(descriptionPath),
      highlight_descendant_taxonomy_ids:
        sourceOutbreak.highlight_descendant_taxonomy_ids ?? null,
      name: sourceOutbreak.name,
      priority: sourceOutbreak.priority,
      resources: sourceOutbreak.resources,
      taxonomy_id: sourceOutbreak.taxonomy_id,
      ...getTaxonomyInfo(sourceOutbreak, taxonomyMappings),
    };

    outbreaks.push(outbreak);
  }

  return outbreaks;
}
