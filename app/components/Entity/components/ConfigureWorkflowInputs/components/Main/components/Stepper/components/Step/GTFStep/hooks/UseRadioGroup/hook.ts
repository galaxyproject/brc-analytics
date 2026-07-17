import { useRadioGroup as useBaseRadioGroup } from "@brc-analytics/core/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/hooks/UseRadioGroup/hook";
import { UseRadioGroup } from "@brc-analytics/core/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/hooks/UseRadioGroup/types";
import { useMemo } from "react";
import { mapControl } from "./utils";

export const useRadioGroup = (
  geneModelUrls: string[] | undefined
): UseRadioGroup & {
  controls: { label: string; value: string }[];
} => {
  const { onChange, onValueChange, value } = useBaseRadioGroup("");

  const controls = useMemo(() => {
    return (geneModelUrls || []).map(mapControl);
  }, [geneModelUrls]);

  return { controls, onChange, onValueChange, value };
};
