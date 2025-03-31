import { useEffect, useState } from "react";
import { BRCDataCatalogGenome } from "../../../../../../../../../../../../../apis/catalog/brc-analytics-catalog/common/entities";
import { parseUCSCFilesResult } from "./utils";
import { UCSC_FILES_ENDPOINT } from "./constants";
import { UseUCSCFiles } from "./types";

export const useUCSCFiles = (genome: BRCDataCatalogGenome): UseUCSCFiles => {
  const assemblyId = genome.accession;
  const [geneModelUrls, setGeneModelUrls] = useState<string[]>([]);

  useEffect(() => {
    fetch(`${UCSC_FILES_ENDPOINT}?genome=${assemblyId}`)
      .then((res) => res.json())
      .then(parseUCSCFilesResult)
      .then((urls) => setGeneModelUrls(urls))
      .catch((e) => {
        throw new Error("Failed to fetch UCSC files", { cause: e });
      });
  }, [assemblyId]);

  return { geneModelUrls };
};
