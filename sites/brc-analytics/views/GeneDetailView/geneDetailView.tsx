import { GENES_BREADCRUMBS } from "@brc/views/GenesView/constants";
import {
  GenesBackPageView,
  GenesPanel,
  ResultsTable,
} from "@brc/views/GenesView/genesView.styles";
import { BackPageHero as BackPageHeroLayout } from "@databiosphere/findable-ui/lib/components/Layout/components/BackPage/backPageView.styles";
import { BackPageHero } from "@databiosphere/findable-ui/lib/components/Layout/components/BackPage/components/BackPageHero/backPageHero";
import { replaceParameters } from "@databiosphere/findable-ui/lib/utils/replaceParameters";
import { sanitizeEntityId } from "@repo/shared/apis/utils";
import { ROUTES } from "@repo/shared/routes/constants";
import {
  geneLabel,
  geneSymbol,
  geneTitle,
} from "@repo/shared/services/genes/label";
import {
  type Gene,
  type GeneLocation,
} from "@repo/shared/services/genes/types";
import { formatNumber } from "@repo/shared/viewModelBuilders/viewModelBuilders";
import Link from "next/link";
import { type JSX } from "react";
import { FieldLabel, FieldList, FieldValue } from "./geneDetailView.styles";

interface GeneDetailViewProps {
  gene: Gene;
}

/**
 * Format a genome location as the stub page shows it.
 * @param location - Genome location.
 * @returns E.g. "NC_037282.1:1,292,966-1,296,696 (+)".
 */
function formatLocation(location: GeneLocation): string {
  const { end, seqName, start, strand } = location;
  return `${seqName}:${formatNumber(start)}-${formatNumber(end)} (${strand})`;
}

export const GeneDetailView = ({ gene }: GeneDetailViewProps): JSX.Element => {
  const assemblyHref = replaceParameters(ROUTES.GENOME, {
    entityId: sanitizeEntityId(gene.assemblyAccession),
  });
  const organismHref = replaceParameters(ROUTES.ORGANISM, {
    entityId: sanitizeEntityId(gene.organism.speciesTaxonomyId),
  });
  const label = geneLabel(gene);
  const breadcrumbs = [...GENES_BREADCRUMBS, { path: "", text: label }];

  return (
    <GenesBackPageView>
      <BackPageHeroLayout>
        <BackPageHero breadcrumbs={breadcrumbs} title={geneTitle(gene)} />
      </BackPageHeroLayout>
      <GenesPanel>
        <FieldList>
          <FieldLabel>Gene ID</FieldLabel>
          <FieldValue>{label}</FieldValue>
          <FieldLabel>Symbol</FieldLabel>
          <FieldValue>{geneSymbol(gene) ?? "—"}</FieldValue>
          <FieldLabel>Organism</FieldLabel>
          <FieldValue>
            <Link href={organismHref}>{gene.organism.name}</Link>
          </FieldValue>
          <FieldLabel>Assembly</FieldLabel>
          <FieldValue>
            <Link href={assemblyHref}>{gene.assemblyAccession}</Link>
          </FieldValue>
          <FieldLabel>Location</FieldLabel>
          <FieldValue>{formatLocation(gene.location)}</FieldValue>
        </FieldList>
        <ResultsTable>
          <thead>
            <tr>
              <th scope="col">Transcript</th>
              <th scope="col">Transcript product</th>
              <th scope="col">Protein</th>
              <th scope="col">Protein product</th>
            </tr>
          </thead>
          <tbody>
            {gene.transcripts.map((transcript, i) => (
              <tr key={i}>
                <td>{transcript.transcriptId ?? "—"}</td>
                <td>{transcript.transcriptProduct ?? "—"}</td>
                <td>{transcript.proteinAccession ?? "—"}</td>
                <td>{transcript.proteinProduct ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </ResultsTable>
      </GenesPanel>
    </GenesBackPageView>
  );
};

/**
 * The gene page while its gene is loading, or when gene data is unavailable.
 * @param props - Component props.
 * @param props.message - What to tell the reader.
 * @returns The page.
 */
export const GeneStatusView = ({
  message,
}: {
  message: string;
}): JSX.Element => {
  return (
    <GenesBackPageView>
      <BackPageHeroLayout>
        <BackPageHero breadcrumbs={GENES_BREADCRUMBS} title="Gene" />
      </BackPageHeroLayout>
      <GenesPanel>{message}</GenesPanel>
    </GenesBackPageView>
  );
};
