import { CellContext } from "@tanstack/react-table";
import { ReadRun } from "../../../../types";
import { LABEL } from "@databiosphere/findable-ui/lib/apis/azul/common/entities";
import { LinkProps } from "@mui/material";

/**
 * Returns Fastq FTP cell context.
 * @param cellContext - Cell context.
 * @returns Model to be used as cellContext for the BasicCell component.
 */
export function buildFastqFTP(
  cellContext: CellContext<ReadRun, unknown>
): CellContext<ReadRun, string> {
  const value = cellContext.getValue();

  // Fastq FTP is a semicolon-separated list of URLs.
  // Grab the last part of each URL.
  const values = String(value)
    .split(";")
    .map((v) => v.trim().split("/").pop())
    .filter(Boolean);

  // If no values, return "None".
  if (values.length === 0)
    return { getValue: () => LABEL.NONE } as CellContext<ReadRun, string>;

  // Otherwise, return the values as a comma-separated string.
  return {
    getValue: () => values.join(", "),
  } as CellContext<ReadRun, string>;
}

/**
 * Returns Study Accession cell context.
 * @param cellContext - Cell context.
 * @returns Model to be used as cellContext for the LinkCell component.
 */
export function buildStudyAccession(
  cellContext: CellContext<ReadRun, unknown>
): CellContext<ReadRun, LinkProps> {
  const value = cellContext.getValue() || "";
  return {
    getValue: () => {
      return {
        children: value,
        href: `value ? https://www.ncbi.nlm.nih.gov/bioproject/?term=${value} : ""`,
      };
    },
  } as CellContext<ReadRun, LinkProps>;
}
