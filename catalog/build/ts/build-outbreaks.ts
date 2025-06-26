import path from "path";
import { Outbreak } from "../../../app/apis/catalog/brc-analytics-catalog/common/entities";
import { Outbreaks as SourceOutbreaks } from "../../schema/generated/schema";
import { readMdxFile, readValuesFile, readYamlFile } from "./utils";

/**
 * Interface for taxonomy mapping data from the TSV file
 */
interface TaxonomyMapping {
  name: string;
  rank: string;
  taxonomy_id: number;
}

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
function determineTaxonFieldAndName(
  outbreak: Outbreak,
  taxonomyMappings: TaxonomyMapping[]
): { taxonName: string; taxonNameField: string } | null {
  // make sure is string
  const taxonomyId = String(outbreak.taxonomy_id);

  // Find the mapping for this taxonomy ID
  const mapping = taxonomyMappings.find(
    (m) => String(m.taxonomy_id) === taxonomyId
  );
  if (!mapping) {
    return null;
  }

  // If the rank is a standard taxonomic rank, use the corresponding taxonomic level field
  const rank = mapping.rank.toLowerCase();
  if (STANDARD_TAXONOMIC_RANKS.includes(rank)) {
    return {
      taxonName: mapping.name,
      taxonNameField: `taxonomicLevel${rank.charAt(0).toUpperCase()}${rank.slice(1)}`,
    };
  }

  // If the rank is not a standard taxonomic rank, use otherTaxa
  return {
    taxonName: mapping.name,
    taxonNameField: "otherTaxa",
  };
}

export async function buildOutbreaks(): Promise<Outbreak[]> {
  // Read the taxonomy mapping data
  let taxonomyMappings: TaxonomyMapping[] = [];

  try {
    taxonomyMappings = await readValuesFile<TaxonomyMapping>(
      OUTBREAK_TAXONOMY_MAPPING_PATH
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
    const outbreak: Outbreak = {
      description: await readMdxFile(descriptionPath),
      highlight_descendant_taxonomy_ids:
        sourceOutbreak.highlight_descendant_taxonomy_ids ?? null,
      name: sourceOutbreak.name,
      priority: sourceOutbreak.priority,
      resources: sourceOutbreak.resources,
      taxonomy_id: sourceOutbreak.taxonomy_id,
    };

    // Determine the taxon field and name for filtering
    const taxonInfo = determineTaxonFieldAndName(outbreak, taxonomyMappings);
    if (taxonInfo) {
      outbreak.taxonNameField = taxonInfo.taxonNameField;
      outbreak.taxonName = taxonInfo.taxonName;
    }

    outbreaks.push(outbreak);
  }

  return outbreaks;
}
