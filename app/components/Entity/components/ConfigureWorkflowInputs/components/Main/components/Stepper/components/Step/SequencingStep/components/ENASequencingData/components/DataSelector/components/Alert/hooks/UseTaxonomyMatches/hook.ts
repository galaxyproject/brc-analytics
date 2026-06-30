import { Table } from "@tanstack/react-table";
import { useEffect, useState } from "react";
import { ReadRun } from "../../../../../../types";
import { UseTaxonomyMatches } from "./types";

export const useTaxonomyMatches = (
  table: Table<ReadRun>
): UseTaxonomyMatches => {
  const [taxonomyMatches, setTaxonomyMatches] = useState<number | null>(null);
  const { getCoreRowModel, getFilteredRowModel } = table;
  const { rows: coreRows } = getCoreRowModel();
  const { rows: filteredRows } = getFilteredRowModel();
  const coreCount = coreRows.length;
  const filteredCount = filteredRows.length;

  useEffect(() => {
    if (taxonomyMatches !== null) return;
    if (coreCount) {
      // The table data is ready, set the taxonomy matches to the number of filtered rows.
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-shot sync of derived count once table data is ready; refactor tracked in #1393
      setTaxonomyMatches(filteredCount);
    }
  }, [coreCount, filteredCount, taxonomyMatches]);

  return { taxonomyMatches };
};
