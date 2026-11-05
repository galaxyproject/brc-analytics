import type { PageMeta } from "@repo/shared/meta/types";
import { DESCRIPTION_LOCALE } from "./constants";
import type { AssemblySummary } from "./types";

/**
 * Describes an assembly in a sentence: its organism, accession, level, counts
 * and length.
 * @param assembly - Assembly.
 * @returns E.g. "Genome assembly GCA_000002825.3 of Trichomonas vaginalis G3,
 * at scaffold level, with 64,769 scaffolds, totaling 176,420,065 bp."
 */
export function buildAssemblyDescription(assembly: AssemblySummary): string {
  const {
    accession,
    chromosomes,
    length,
    level,
    scaffoldCount,
    strainName,
    taxonomicLevelSpecies,
  } = assembly;
  const organism = strainName
    ? `${taxonomicLevelSpecies} ${strainName}`
    : taxonomicLevelSpecies;
  const counts = [
    countOf(chromosomes, "chromosome"),
    countOf(scaffoldCount, "scaffold"),
  ].filter(Boolean);
  return [
    `Genome assembly ${accession} of ${organism}`,
    `at ${level.toLowerCase()} level`,
    ...(counts.length > 0 ? [`with ${counts.join(" and ")}`] : []),
    `totaling ${length.toLocaleString(DESCRIPTION_LOCALE)} bp.`,
  ].join(", ");
}

/**
 * The assembly's name: its species, strain if it has one, and accession. The
 * strain is the catalog's strain name, not its strain-level taxon, which
 * repeats the species (e.g. "Trichomonas vaginalis strain G3").
 * @param assembly - Assembly.
 * @returns E.g. "Trichomonas vaginalis — G3 (GCA_000002825.3)".
 */
export function buildAssemblyName(assembly: AssemblySummary): string {
  const { accession, strainName, taxonomicLevelSpecies } = assembly;
  const strain = strainName ? ` — ${strainName}` : "";
  return `${taxonomicLevelSpecies}${strain} (${accession})`;
}

/**
 * An assembly page's title and description: its name and its descriptive
 * sentence.
 * @param assembly - Assembly.
 * @returns Page metadata.
 */
export function buildAssemblyPageMeta(assembly: AssemblySummary): PageMeta {
  return {
    pageDescription: buildAssemblyDescription(assembly),
    pageTitle: buildAssemblyName(assembly),
  };
}

/**
 * A count with its noun, e.g. "1 chromosome" or "14 chromosomes".
 * @param count - Count, or null when unknown.
 * @param noun - Singular noun.
 * @returns The phrase, or null when the count is unknown or zero.
 */
function countOf(count: number | null, noun: string): string | null {
  if (!count) return null;
  return `${count.toLocaleString(DESCRIPTION_LOCALE)} ${noun}${count === 1 ? "" : "s"}`;
}
