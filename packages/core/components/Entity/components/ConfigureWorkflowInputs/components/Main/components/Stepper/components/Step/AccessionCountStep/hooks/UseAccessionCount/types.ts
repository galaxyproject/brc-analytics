import { ChangeEvent } from "react";

export interface UseAccessionCount {
  disabled: boolean;
  inputValue: string;
  numberOfHits: number;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
}
