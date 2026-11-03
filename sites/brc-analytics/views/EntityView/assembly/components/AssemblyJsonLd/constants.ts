import { BRC_DATA_CATALOG_CATEGORY_LABEL as LABEL } from "@site-config/brc-analytics/category";
import { type VariableMeasured } from "./types";

// The locale the description's numbers are written in, so the record reads the
// same whatever the build machine's or reader's locale.
export const DESCRIPTION_LOCALE = "en-US";

// The downloads, the genome sequence (FASTA) and gene model (GTF), are gzipped
// files from the UCSC Genome Browser's downloads.
export const DOWNLOAD_ENCODING_FORMAT = "application/gzip";
export const GENE_MODEL_NAME =
  "Gene annotation (GTF), from the UCSC Genome Browser";
export const GENOME_SEQUENCE_NAME =
  "Genome sequence (FASTA), from the UCSC Genome Browser";

// Google Dataset Search reads at most 5000 characters of a description.
export const MAX_DESCRIPTION_LENGTH = 5000;

// The catalog's value for a taxonomic level an assembly's lineage lacks.
export const MISSING_TAXONOMIC_LEVEL = "None";

// The assembly statistics a dataset record lists, in order, named as the
// site's columns name them, with their units.
export const VARIABLES_MEASURED = [
  { key: "chromosomes", name: LABEL.CHROMOSOMES },
  { key: "scaffoldCount", name: LABEL.SCAFFOLD_COUNT },
  { key: "scaffoldN50", name: LABEL.SCAFFOLD_N50, unitText: "bp" },
  { key: "scaffoldL50", name: LABEL.SCAFFOLD_L50 },
  { key: "gcPercent", name: LABEL.GC_PERCENT, unitText: "%" },
  { key: "length", name: LABEL.LENGTH, unitText: "bp" },
  { key: "coverage", name: LABEL.COVERAGE, unitText: "x" },
] as const satisfies readonly VariableMeasured[];
