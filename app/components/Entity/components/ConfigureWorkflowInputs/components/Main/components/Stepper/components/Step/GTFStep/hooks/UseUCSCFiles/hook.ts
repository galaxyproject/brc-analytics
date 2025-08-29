import { useEffect, useState } from "react";
import { BRCDataCatalogGenome } from "../../../../../../../../../../../../../apis/catalog/brc-analytics-catalog/common/entities";
import { parseUCSCFilesResult } from "./utils";
import { UCSC_FILES_ENDPOINT } from "./constants";
import { UseUCSCFiles } from "./types";
import { GA2AssemblyEntity } from "../../../../../../../../../../../../../apis/catalog/ga2/entities";

const SPECIAL_CASE_ASSEMBLY_LOOKUP: Record<string, string> = {
  "GCF_000001405.40": "hg38",
} as const;

export const useUCSCFiles = (
  genome: BRCDataCatalogGenome | GA2AssemblyEntity
): UseUCSCFiles => {
  const assemblyId =
    SPECIAL_CASE_ASSEMBLY_LOOKUP[genome.accession] ?? genome.accession;
  const [geneModelUrls, setGeneModelUrls] = useState<string[] | undefined>();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!assemblyId) {
      setError("Assembly ID is required");
      return;
    }

    setIsLoading(true);
    setError(null);
    setGeneModelUrls(undefined);

    fetch(`${UCSC_FILES_ENDPOINT}?genome=${assemblyId}`)
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
        return res.json();
      })
      .then(parseUCSCFilesResult)
      .then((urls) => {
        setGeneModelUrls(urls);
        setIsLoading(false);
      })
      .catch((e) => {
        const errorMessage =
          e instanceof Error ? e.message : "Failed to fetch UCSC files";
        setError(errorMessage);
        setIsLoading(false);
        setGeneModelUrls(undefined);
      });
  }, [assemblyId]);

  return { error, geneModelUrls, isLoading };
};
