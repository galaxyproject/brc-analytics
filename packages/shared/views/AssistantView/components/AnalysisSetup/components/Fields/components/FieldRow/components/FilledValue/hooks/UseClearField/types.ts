import type { KeyboardEvent, SyntheticEvent } from "react";

export interface UseClearField {
  onClear: (event: SyntheticEvent) => void;
  onKeyDown: (event: KeyboardEvent<HTMLDivElement>) => void;
}
