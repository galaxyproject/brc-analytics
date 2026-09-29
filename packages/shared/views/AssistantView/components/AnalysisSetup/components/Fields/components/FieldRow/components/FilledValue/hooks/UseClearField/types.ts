import type { KeyboardEvent } from "react";

export interface UseClearField {
  onClear: () => void;
  onKeyDown: (event: KeyboardEvent<HTMLDivElement>) => void;
}
