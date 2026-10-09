import { type LoganFilters, type LoganListField } from "./filters";

// What a breakdown needs to act as a filter control. Absent while the
// logan-filters flag is off, which is what keeps every view as it was.
export interface LoganFilterControls {
  // Why filtering cannot run for this search (no export on disk), or null.
  // Controls are inert while it is set; active chips stay removable.
  disabledReason: string | null;
  filters: LoganFilters;
  onToggle: (field: LoganListField, value: string) => void;
  onToggleYear: (year: number) => void;
}
