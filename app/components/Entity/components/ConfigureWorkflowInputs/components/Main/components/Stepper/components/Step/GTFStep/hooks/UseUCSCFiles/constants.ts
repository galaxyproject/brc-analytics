export const DOWNLOAD_BASE_URL = "https://hgdownload.soe.ucsc.edu";

export const SPECIAL_CASE_ASSEMBLY_LOOKUP: Record<string, string> = {
  "GCF_000001405.40": "hg38",
} as const;

export const UCSC_FILES_ENDPOINT = "https://api.genome.ucsc.edu/list/files";
