import type { ReadRun } from "@/components/Entity/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/SequencingStep/components/ENASequencingData/types";
import type { Table } from "@tanstack/react-table";
import { useState } from "react";
import type { UseTaxonomyMatches } from "./types";

export const useTaxonomyMatches = (
  table: Table<ReadRun>
): UseTaxonomyMatches => {
  const [taxonomyMatches, setTaxonomyMatches] = useState<number | null>(null);
  const { getCoreRowModel, getFilteredRowModel } = table;
  const { rows: coreRows } = getCoreRowModel();
  const { rows: filteredRows } = getFilteredRowModel();
  const coreCount = coreRows.length;
  const filteredCount = filteredRows.length;

  // Once the table data is ready, capture the filtered-row count a single time.
  // Adjusting state during render is React's recommended alternative to a
  // sync-in-effect; the null guard means this fires at most once.
  if (taxonomyMatches === null && coreCount > 0) {
    setTaxonomyMatches(filteredCount);
  }

  return { taxonomyMatches };
};
