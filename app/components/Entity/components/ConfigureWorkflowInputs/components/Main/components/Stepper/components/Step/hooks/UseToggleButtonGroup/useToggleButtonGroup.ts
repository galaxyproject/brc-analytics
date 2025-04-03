import { MouseEvent, useCallback, useState } from "react";
import { ToggleButtonGroupProps } from "@mui/material";

export const useToggleButtonGroup = (
  initialValue: ToggleButtonGroupProps["value"]
): ToggleButtonGroupProps => {
  const [value, setValue] =
    useState<ToggleButtonGroupProps["value"]>(initialValue);

  const onChange = useCallback(
    (_: MouseEvent, value: ToggleButtonGroupProps["value"]): void => {
      if (value === null) return;
      setValue(value);
    },
    []
  );

  return {
    onChange,
    value,
  };
};
