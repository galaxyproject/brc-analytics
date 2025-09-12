import { Table } from "@tanstack/react-table";
import { EnaSequencingReads } from "../../../../../../../../../../../../../utils/galaxy-api/entities";
import { ReadRun } from "./types";

/**
 * Build EnaSequencingReads from table selected rows.
 * @param table - Table.
 * @returns Array of EnaSequencingReads.
 */
export function buildEnaSequencingReads(
  table: Table<ReadRun>
): EnaSequencingReads[] {
  return table.getSelectedRowModel().rows.map(
    (row): EnaSequencingReads => ({
      md5Hashes: row.original.fastq_md5,
      runAccession: row.original.run_accession,
      urls: row.original.fastq_ftp,
    })
  );
}
