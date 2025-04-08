import { LABEL } from "@databiosphere/findable-ui/lib/apis/azul/common/entities";
import { ConfiguredValue } from "../hooks/UseLaunchGalaxy/types";
import { UseRadioGroup } from "../hooks/UseRadioGroup/types";
import { OnConfigure } from "../../../../../../../../../../../views/WorkflowInputsView/hooks/UseConfigureInputs/types";

/**
 * Configures the GTF step.
 * @param geneModelUrls - Gene model URLs.
 * @param entryKey - Configured value key.
 * @param entryLabel - Configured value display label.
 * @param onConfigure - Callback function to configure the step.
 * @param onValueChange - Callback function to handle value changes.
 */
export const configureGTFStep = (
  geneModelUrls: string[] | undefined,
  entryKey: keyof ConfiguredValue,
  entryLabel: string,
  onConfigure: OnConfigure,
  onValueChange: UseRadioGroup["onValueChange"]
): void => {
  // Gene model URLs are not yet loaded.
  if (!geneModelUrls) return;

  // Gene model URLs are not available for this workflow.
  if (geneModelUrls.length === 0) {
    onConfigure(entryKey, entryLabel, [{ key: null, value: LABEL.NONE }]);
    return;
  }

  // Get the preferred gene model.
  const value = getPreferredGeneModel(geneModelUrls);

  // Update radio state.
  onValueChange(value);

  // If no preferred gene model is found, do nothing.
  if (!value) return;

  // Otherwise, use the gene model to configure the step.
  onConfigure(entryKey, entryLabel, [
    { key: value, value: getGeneModelLabel(value) },
  ]);
};

/**
 * Maps a gene model URL to a display label.
 * @param url - Gene model URL.
 * @returns The display label for the gene model.
 */
export const getGeneModelLabel = (url: string): string => {
  const filename = url.split("/").pop() || "";

  const labelPatterns: [RegExp, string][] = [
    [/\.augustus\./, "Augustus"],
    [/\.ncbiRefSeq\./, "NCBI RefSeq"],
    [/\.ncbiGene\./, "NCBI Gene"],
  ];

  for (const [pattern, label] of labelPatterns) {
    if (pattern.test(filename)) {
      return label;
    }
  }

  return filename;
};

/**
 * Returns the preferred gene model based on the order of preference.
 * Preference is given to NCBI RefSeq, NCBI Gene, then Augustus, otherwise empty string.
 * @param geneModelUrls - Gene model URLs.
 * @returns The preferred gene model.
 */
export const getPreferredGeneModel = (geneModelUrls: string[]): string => {
  const preferredTypes = ["ncbiRefSeq", "ncbiGene", "augustus"];
  for (const preferredType of preferredTypes) {
    for (const url of geneModelUrls) {
      if (url.includes(preferredType)) {
        return url;
      }
    }
  }
  return "";
};
