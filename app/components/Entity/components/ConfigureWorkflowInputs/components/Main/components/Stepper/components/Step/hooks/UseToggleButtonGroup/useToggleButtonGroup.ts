import { type ToggleButtonGroupProps } from "@mui/material";
import { type MouseEvent, useCallback, useState } from "react";

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
