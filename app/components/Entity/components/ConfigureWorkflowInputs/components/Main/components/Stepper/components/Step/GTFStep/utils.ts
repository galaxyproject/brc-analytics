/**
 * Maps a gene model URL to a display label.
 * @param url - Gene model URL.
 * @returns The display label for the gene model.
 */
export const getGeneModelLabel = (url: string): string => {
  const filename = url.split("/").pop() || "";
  if (filename.includes(".augustus.")) {
    return "Augustus";
  } else if (filename.includes(".ncbiRefSeq.")) {
    return "NCBI RefSeq";
  } else {
    return filename;
  }
};

/**
 * Returns the initial value for the radio group based on the provided gene model URLs.
 * Preference is given to NCBI RefSeq, NCBI Gene, then Augustus, otherwise empty string.
 * @param geneModelUrls - Gene model URLs.
 * @returns The initial value for the radio group.
 */
export const getInitialValue = (geneModelUrls: string[]): string => {
  const priorityTypes = ["ncbiRefSeq", "ncbiGene", "augustus"];
  for (const priorityType of priorityTypes) {
    for (const url of geneModelUrls) {
      if (url.includes(priorityType)) {
        return url;
      }
    }
  }
  return "";
};
