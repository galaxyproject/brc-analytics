import { GenesPanel } from "@brc/components/Genes/genes.styles";
import { BackPageHero as BackPageHeroLayout } from "@databiosphere/findable-ui/lib/components/Layout/components/BackPage/backPageView.styles";
import { BackPageHero } from "@databiosphere/findable-ui/lib/components/Layout/components/BackPage/components/BackPageHero/backPageHero";
import { replaceParameters } from "@databiosphere/findable-ui/lib/utils/replaceParameters";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import { sanitizeEntityId } from "@repo/shared/apis/utils";
import { ROUTES } from "@repo/shared/routes/constants";
import {
  geneLabel,
  geneSymbol,
  geneTitle,
} from "@repo/shared/services/genes/label";
import Link from "next/link";
import { type JSX } from "react";
import { LocationValue } from "./components/LocationValue/locationValue";
import { GENE_BREADCRUMBS } from "./constants";
import {
  FieldLabel,
  FieldList,
  FieldValue,
  GeneBackPageView,
} from "./geneDetailView.styles";
import { type GeneDetailViewProps, type GeneStatusViewProps } from "./types";

export const GeneDetailView = ({ gene }: GeneDetailViewProps): JSX.Element => {
  const assemblyHref = replaceParameters(ROUTES.GENOME, {
    entityId: sanitizeEntityId(gene.assemblyAccession),
  });
  const organismHref = replaceParameters(ROUTES.ORGANISM, {
    entityId: sanitizeEntityId(gene.organism.speciesTaxonomyId),
  });
  const label = geneLabel(gene);

  return (
    <GeneBackPageView>
      <BackPageHeroLayout>
        <BackPageHero
          breadcrumbs={[...GENE_BREADCRUMBS, { path: "", text: label }]}
          title={geneTitle(gene)}
        />
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
          <FieldValue>
            <LocationValue
              location={gene.location}
              ucscBrowserUrl={gene.ucscBrowserUrl}
            />
          </FieldValue>
        </FieldList>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Transcript</TableCell>
                <TableCell>Transcript product</TableCell>
                <TableCell>Protein</TableCell>
                <TableCell>Protein product</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {gene.transcripts.map((transcript) => (
                <TableRow key={transcript.gff3RowId}>
                  <TableCell>{transcript.transcriptId ?? "—"}</TableCell>
                  <TableCell>{transcript.transcriptProduct ?? "—"}</TableCell>
                  <TableCell>{transcript.proteinAccession ?? "—"}</TableCell>
                  <TableCell>{transcript.proteinProduct ?? "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </GenesPanel>
    </GeneBackPageView>
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
}: GeneStatusViewProps): JSX.Element => {
  return (
    <GeneBackPageView>
      <BackPageHeroLayout>
        <BackPageHero breadcrumbs={GENE_BREADCRUMBS} title="Gene" />
      </BackPageHeroLayout>
      <GenesPanel>{message}</GenesPanel>
    </GeneBackPageView>
  );
};
