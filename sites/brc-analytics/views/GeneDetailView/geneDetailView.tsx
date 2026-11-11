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
import { EMPTY_VALUE } from "@repo/shared/services/genes/constants";
import {
  geneLabel,
  geneSymbol,
  geneTitle,
} from "@repo/shared/services/genes/label";
import { GENOME_BROWSER_IMAGE_PROPS } from "@repo/shared/viewModelBuilders/constants";
import Link from "next/link";
import { type JSX } from "react";
import { BionymSection } from "./components/BionymSection/bionymSection";
import { OffSiteLink } from "./components/OffSiteLink/offSiteLink";
import { GENE_BREADCRUMBS } from "./constants";
import {
  FieldLabel,
  FieldList,
  FieldValue,
  GeneBackPageView,
} from "./geneDetailView.styles";
import { type GeneDetailViewProps, type GeneStatusViewProps } from "./types";
import {
  formatAnnotation,
  formatLocation,
  getGeneTypeName,
  getNcbiGeneId,
  getNcbiGeneUrl,
  getPreviousIds,
  getUcscPositionUrl,
} from "./utils";

export const GeneDetailView = ({
  bionym,
  gene,
}: GeneDetailViewProps): JSX.Element => {
  const assemblyHref = replaceParameters(ROUTES.GENOME, {
    entityId: sanitizeEntityId(gene.assemblyAccession),
  });
  const organismHref = replaceParameters(ROUTES.ORGANISM, {
    entityId: sanitizeEntityId(gene.organism.speciesTaxonomyId),
  });
  const label = geneLabel(gene);
  const ncbiGeneId = getNcbiGeneId(gene.aliases);
  const ncbiGeneUrl = getNcbiGeneUrl(ncbiGeneId);
  const previousIds = getPreviousIds(gene.aliases);

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
          <FieldValue>
            <OffSiteLink text={label} url={ncbiGeneUrl} />
          </FieldValue>
          <FieldLabel>Symbol</FieldLabel>
          <FieldValue>{geneSymbol(gene) ?? EMPTY_VALUE}</FieldValue>
          <FieldLabel>Gene type</FieldLabel>
          <FieldValue>
            {getGeneTypeName(gene.biotype) ?? EMPTY_VALUE}
          </FieldValue>
          <FieldLabel>NCBI GeneID</FieldLabel>
          <FieldValue>
            <OffSiteLink text={ncbiGeneId || EMPTY_VALUE} url={ncbiGeneUrl} />
          </FieldValue>
          {previousIds.length > 0 && (
            <>
              <FieldLabel>Previous IDs</FieldLabel>
              <FieldValue>
                {previousIds.map((previousId) => (
                  <div key={previousId}>{previousId}</div>
                ))}
              </FieldValue>
            </>
          )}
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
            <OffSiteLink
              imageProps={GENOME_BROWSER_IMAGE_PROPS}
              text={formatLocation(gene.location)}
              url={getUcscPositionUrl(gene.ucscBrowserUrl, gene.location)}
            />
          </FieldValue>
          <FieldLabel>Annotation</FieldLabel>
          <FieldValue>{formatAnnotation(gene.provenance)}</FieldValue>
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
                  <TableCell>
                    {transcript.transcriptId ?? EMPTY_VALUE}
                  </TableCell>
                  <TableCell>
                    {transcript.transcriptProduct ?? EMPTY_VALUE}
                  </TableCell>
                  <TableCell>
                    {transcript.proteinAccession ?? EMPTY_VALUE}
                  </TableCell>
                  <TableCell>
                    {transcript.proteinProduct ?? EMPTY_VALUE}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </GenesPanel>
      {bionym && <BionymSection bionym={bionym} />}
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
