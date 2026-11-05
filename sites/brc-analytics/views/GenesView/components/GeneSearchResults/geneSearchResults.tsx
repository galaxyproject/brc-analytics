import { describeMatch } from "@brc/views/GenesView/utils";
import { TYPOGRAPHY_PROPS } from "@databiosphere/findable-ui/lib/styles/common/mui/typography";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { ROUTES } from "@repo/shared/routes/constants";
import {
  GENE_SEARCH_LIMIT,
  GENE_SEARCH_MAX_LENGTH,
  GENE_SEARCH_MAX_WORDS,
} from "@repo/shared/services/genes/constants";
import { geneLabel } from "@repo/shared/services/genes/label";
import Link from "next/link";
import { type JSX, type ReactNode } from "react";
import { type GeneSearchResultsProps } from "./types";

/**
 * A gene search's results, each with what it matched on, or why there are
 * none.
 * @param props - Component props.
 * @param props.search - The search's state.
 * @returns The results' table, or a message.
 */
export const GeneSearchResults = ({
  search,
}: GeneSearchResultsProps): JSX.Element => {
  switch (search.status) {
    case "loading":
      return <Message>Searching…</Message>;
    case "unavailable":
      return (
        <Message>
          Gene search is unavailable right now. Please try again later.
        </Message>
      );
    case "invalid":
      return (
        <Message>
          Search for at most {GENE_SEARCH_MAX_WORDS} words and{" "}
          {GENE_SEARCH_MAX_LENGTH} characters.
        </Message>
      );
  }
  const { query, results, truncated } = search;
  if (results.length === 0)
    return <Message>No genes match &ldquo;{query}&rdquo;.</Message>;
  return (
    <>
      {truncated && (
        <Message>
          Showing the first {GENE_SEARCH_LIMIT} matches; refine your search.
        </Message>
      )}
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Gene ID</TableCell>
              <TableCell>Symbol</TableCell>
              <TableCell>Organism</TableCell>
              <TableCell>Match</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {results.map((result) => (
              <TableRow key={result.geneUid}>
                <TableCell>
                  <Link href={`${ROUTES.GENE_DETAIL}?uid=${result.geneUid}`}>
                    {geneLabel(result)}
                  </Link>
                </TableCell>
                <TableCell>{result.symbol ?? "—"}</TableCell>
                <TableCell>{result.organism.name}</TableCell>
                <TableCell>{describeMatch(result.matchedOn)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );
};

/**
 * A line of text about the search.
 * @param props - Component props.
 * @param props.children - The text.
 * @returns The text, announced to screen readers when it changes.
 */
const Message = ({ children }: { children: ReactNode }): JSX.Element => (
  <Typography role="status" variant={TYPOGRAPHY_PROPS.VARIANT.BODY_400}>
    {children}
  </Typography>
);
