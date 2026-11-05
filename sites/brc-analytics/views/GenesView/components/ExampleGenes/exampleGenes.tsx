import { EXAMPLE_GENES } from "@brc/views/GenesView/constants";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import { ROUTES } from "@repo/shared/routes/constants";
import Link from "next/link";
import { type JSX } from "react";

/**
 * Example genes of the temporary 3D7 snapshot, shown until a search is made.
 * @returns The examples' table.
 */
export const ExampleGenes = (): JSX.Element => {
  return (
    <TableContainer>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Gene ID</TableCell>
            <TableCell>Symbol</TableCell>
            <TableCell>Example of</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {EXAMPLE_GENES.map(({ geneUid, locusTag, note, symbol }) => (
            <TableRow key={geneUid}>
              <TableCell>
                <Link href={`${ROUTES.GENE_DETAIL}?uid=${geneUid}`}>
                  {locusTag}
                </Link>
              </TableCell>
              <TableCell>{symbol ?? "—"}</TableCell>
              <TableCell>{note}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};
