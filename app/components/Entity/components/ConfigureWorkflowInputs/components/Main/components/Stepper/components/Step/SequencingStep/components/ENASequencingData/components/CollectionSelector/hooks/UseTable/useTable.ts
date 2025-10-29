import { Table } from "@tanstack/react-table";
import { ReadRun } from "../../../../types";
import { ENA_QUERY_METHOD } from "../../../../../../types";
import { useMemo } from "react";

export const useTable = (
  enaQueryMethod: ENA_QUERY_METHOD,
  enaByAccessionTable: Table<ReadRun>,
  enaByTaxonomyIdTable: Table<ReadRun>
): Table<ReadRun> => {
  const isEnaByAccession = enaQueryMethod === ENA_QUERY_METHOD.ACCESSION;

  return useMemo(
    () => (isEnaByAccession ? enaByAccessionTable : enaByTaxonomyIdTable),
    [enaByAccessionTable, enaByTaxonomyIdTable, isEnaByAccession]
  );
};
