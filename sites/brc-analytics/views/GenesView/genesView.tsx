import { GenesPanel } from "@brc/components/Genes/genes.styles";
import { type JSX } from "react";
import { ExampleGenes } from "./components/ExampleGenes/exampleGenes";
import { GeneSearchForm } from "./components/GeneSearchForm/geneSearchForm";
import { GeneSearchResults } from "./components/GeneSearchResults/geneSearchResults";
import { StyledGrid, StyledTitle } from "./genesView.styles";
import { type GenesViewProps } from "./types";

/**
 * The genes page: a search box, and the search's results, or example genes
 * until a search is made.
 * @param props - Component props.
 * @param props.onSearch - Called with a new search; empty to clear it.
 * @param props.query - The search shown, from the page's ?q=.
 * @param props.search - The search's state.
 * @returns The genes page.
 */
export const GenesView = ({
  onSearch,
  query,
  search,
}: GenesViewProps): JSX.Element => {
  return (
    <StyledGrid>
      <StyledTitle>Genes</StyledTitle>
      <GenesPanel>
        <GeneSearchForm key={query} onSearch={onSearch} query={query} />
        {search.status === "idle" ? (
          <ExampleGenes />
        ) : (
          <GeneSearchResults search={search} />
        )}
      </GenesPanel>
    </StyledGrid>
  );
};
