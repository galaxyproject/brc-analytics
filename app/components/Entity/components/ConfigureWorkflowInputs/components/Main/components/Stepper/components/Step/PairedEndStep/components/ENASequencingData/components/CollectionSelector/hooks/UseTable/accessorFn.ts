import { ReadRun } from "../../../../types";
import { LABEL } from "@databiosphere/findable-ui/lib/apis/azul/common/entities";

/**
 * Returns the fastq_ftp value from the row - the last part of the URL.
 * @param row - Row.
 * @returns fastq_ftp value or "None" if not available.
 */
export function getFastqFTP(row: ReadRun): string {
  if (!row.fastq_ftp) return LABEL.NONE;
  return row.fastq_ftp.split("/").pop() || LABEL.NONE;
}
