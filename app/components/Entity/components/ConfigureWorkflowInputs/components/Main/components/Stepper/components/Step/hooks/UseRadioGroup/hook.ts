import { ChangeEvent, useCallback, useState } from "react";
import { UseRadioGroup, Value } from "./types";

export const useRadioGroup = (initialValue: Value): UseRadioGroup => {
  const [value, setValue] = useState<Value>(initialValue);

  const onChange = useCallback((_: ChangeEvent, value: Value): void => {
    setValue(value);
  }, []);

  const onValueChange = useCallback((value: Value): void => {
    setValue(value);
  }, []);

  return {
    onChange,
    onValueChange,
    value,
  };
};
