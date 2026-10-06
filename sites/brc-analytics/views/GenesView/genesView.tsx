import { Button } from "@mui/material";
import { SectionHero } from "@repo/shared/components/layout/SectionHero/sectionHero";
import { ROUTES } from "@repo/shared/routes/constants";
import { EXAMPLE_GENE_IDS } from "@repo/shared/services/genes/fixture";
import { searchGenes } from "@repo/shared/services/genes/searchGenes";
import { type GeneSearchResult } from "@repo/shared/services/genes/types";
import Link from "next/link";
import { useRouter } from "next/router";
import { Fragment, type JSX, useMemo } from "react";
import {
  AliasNote,
  ContentContainer,
  ExampleGenes,
  NoResults,
  ResultsTable,
  SearchSection,
} from "./genesView.styles";

const BREADCRUMBS = [
  { path: "/", text: "Home" },
  { path: ROUTES.GENES, text: "Genes" },
];

const SUPPORTED_ID_TYPES = [
  "NCBI gene ID (locus tag)",
  "gene symbol",
  "VEuPathDB ID",
  "previous gene ID (alias)",
];

export const GenesView = (): JSX.Element => {
  const router = useRouter();
  const rawQuery = typeof router.query.q === "string" ? router.query.q : "";
  const query = rawQuery.trim();
  const results = useMemo(() => searchGenes(query), [query]);

  const handleExampleClick = (geneId: string): void => {
    router
      .push({ pathname: ROUTES.GENES, query: { ...router.query, q: geneId } })
      .catch(() => undefined);
  };

  return (
    <Fragment>
      <SectionHero
        breadcrumbs={BREADCRUMBS}
        head="Genes"
        subHead="Search for genes across all catalog assemblies by identifier, symbol, or alias"
      />
      <SearchSection>
        <ContentContainer>
          {query ? (
            <Results query={query} results={results} />
          ) : (
            <ExampleGenesPanel onExampleClick={handleExampleClick} />
          )}
        </ContentContainer>
      </SearchSection>
    </Fragment>
  );
};

function ExampleGenesPanel({
  onExampleClick,
}: {
  onExampleClick: (geneId: string) => void;
}): JSX.Element {
  return (
    <div>
      <p>Try searching for one of these example genes:</p>
      <ExampleGenes>
        {EXAMPLE_GENE_IDS.map((geneId) => (
          <Button
            key={geneId}
            onClick={() => onExampleClick(geneId)}
            size="small"
            variant="outlined"
          >
            {geneId}
          </Button>
        ))}
      </ExampleGenes>
    </div>
  );
}

function Results({
  query,
  results,
}: {
  query: string;
  results: GeneSearchResult[];
}): JSX.Element {
  if (results.length === 0) {
    return (
      <NoResults>
        <p>No genes found for &ldquo;{query}&rdquo;.</p>
        <p>Supported identifier types: {SUPPORTED_ID_TYPES.join(", ")}.</p>
      </NoResults>
    );
  }

  return (
    <ResultsTable>
      <thead>
        <tr>
          <th scope="col">Gene ID</th>
          <th scope="col">Symbol</th>
          <th scope="col">Product</th>
          <th scope="col">Organism</th>
          <th scope="col">Assembly</th>
        </tr>
      </thead>
      <tbody>
        {results.map(({ gene, matchedAlias }) => (
          <tr key={gene.geneUid}>
            <td>
              <Link href={`/data/genes/detail?uid=${gene.geneUid}`}>
                {gene.geneId}
              </Link>
              {matchedAlias && (
                <>
                  {" "}
                  <AliasNote>
                    matched previous ID &ldquo;{matchedAlias}&rdquo;
                  </AliasNote>
                </>
              )}
            </td>
            <td>{gene.symbol || "—"}</td>
            <td>{gene.product}</td>
            <td>{gene.organism}</td>
            <td>{gene.assemblyAccession}</td>
          </tr>
        ))}
      </tbody>
    </ResultsTable>
  );
}
