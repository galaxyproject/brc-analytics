import { useRadioGroup as useBaseRadioGroup } from "../../../hooks/UseRadioGroup/hook";
import { useMemo } from "react";
import { UseRadioGroup } from "../../../hooks/UseRadioGroup/types";
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
