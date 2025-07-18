import { Table } from "@tanstack/react-table";
import { EnaPairedReads } from "../../../../../../../../../../../../../utils/galaxy-api/entities";
import { ReadRun } from "./types";

/**
 * Build EnaPairedReads from table selected rows.
 * @param table - Table.
 * @returns Array of EnaPairedReads.
 */
export function buildEnaPairedReads(table: Table<ReadRun>): EnaPairedReads[] {
  return table.getSelectedRowModel().rows.map(
    (row): EnaPairedReads => ({
      md5Hashes: row.original.fastq_md5,
      runAccession: row.original.run_accession,
      urls: row.original.fastq_ftp,
    })
  );
}
