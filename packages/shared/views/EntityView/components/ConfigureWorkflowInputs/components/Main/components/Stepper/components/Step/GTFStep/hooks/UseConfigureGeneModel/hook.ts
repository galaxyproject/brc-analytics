import { configureGTFStep } from "@repo/shared/views/EntityView/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/GTFStep/utils";
import { type UseRadioGroup } from "@repo/shared/views/EntityView/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/hooks/UseRadioGroup/types";
import { type OnConfigure } from "@repo/shared/views/WorkflowInputsView/hooks/UseConfigureInputs/types";
import { useEffect } from "react";

/**
 * Configures the gene model from the assembly's gene model URLs. Runs again
 * when the assembly changes as well as when the URLs do: the query can return
 * the previous result unchanged for a new assembly (e.g. two assemblies with
 * no gene models), and the gene model still has to be reconfigured for it.
 * @param assemblyId - Assembly the gene model URLs are for.
 * @param geneModelUrls - Gene model URLs, or undefined while loading.
 * @param onConfigure - Callback to configure workflow input.
 * @param onValueChange - Callback to update the radio group value.
 */
export const useConfigureGeneModel = (
  assemblyId: string | undefined,
  geneModelUrls: string[] | undefined,
  onConfigure: OnConfigure,
  onValueChange: UseRadioGroup["onValueChange"]
): void => {
  useEffect(() => {
    configureGTFStep(geneModelUrls, onConfigure, onValueChange);
  }, [assemblyId, geneModelUrls, onConfigure, onValueChange]);
};
