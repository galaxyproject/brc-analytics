import { useEffect, useState } from "react";
import { getAssemblyId, parseUCSCFilesResult } from "./utils";
import { UCSC_FILES_ENDPOINT } from "./constants";
import { UseUCSCFiles } from "./types";
import { Assembly } from "../../../../../../../../../../../../../views/WorkflowInputsView/types";

export const useUCSCFiles = (genome?: Assembly): UseUCSCFiles => {
  const [geneModelUrls, setGeneModelUrls] = useState<string[] | undefined>();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const assemblyId = getAssemblyId(genome);

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
