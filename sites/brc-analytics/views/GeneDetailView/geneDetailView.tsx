import { GENES_BREADCRUMBS } from "@brc/views/GenesView/constants";
import { replaceParameters } from "@databiosphere/findable-ui/lib/utils/replaceParameters";
import { sanitizeEntityId } from "@repo/shared/apis/utils";
import { SectionHero } from "@repo/shared/components/layout/SectionHero/sectionHero";
import { ROUTES } from "@repo/shared/routes/constants";
import { geneLabel, geneSymbol } from "@repo/shared/services/genes/label";
import {
  type Gene,
  type GeneLocation,
} from "@repo/shared/services/genes/types";
import { formatNumber } from "@repo/shared/viewModelBuilders/viewModelBuilders";
import Link from "next/link";
import { Fragment, type JSX } from "react";
import {
  DetailSection,
  FieldLabel,
  FieldList,
  FieldValue,
} from "./geneDetailView.styles";

interface GeneDetailViewProps {
  gene: Gene;
  title: string;
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

export const GeneDetailView = ({
  gene,
  title,
}: GeneDetailViewProps): JSX.Element => {
  const assemblyHref = replaceParameters(ROUTES.GENOME, {
    entityId: sanitizeEntityId(gene.assemblyAccession),
  });
  const label = geneLabel(gene);
  const breadcrumbs = [...GENES_BREADCRUMBS, { path: "", text: label }];

  return (
    <Fragment>
      <SectionHero
        breadcrumbs={breadcrumbs}
        head={title}
        subHead={gene.product ?? undefined}
      />
      <DetailSection>
        <FieldList>
          <FieldLabel>Gene ID</FieldLabel>
          <FieldValue>{label}</FieldValue>
          <FieldLabel>Symbol</FieldLabel>
          <FieldValue>{geneSymbol(gene) ?? "—"}</FieldValue>
          <FieldLabel>Product</FieldLabel>
          <FieldValue>{gene.product ?? "—"}</FieldValue>
          <FieldLabel>Organism</FieldLabel>
          <FieldValue>{gene.organism.name}</FieldValue>
          <FieldLabel>Assembly</FieldLabel>
          <FieldValue>
            <Link href={assemblyHref}>{gene.assemblyAccession}</Link>
          </FieldValue>
          <FieldLabel>Location</FieldLabel>
          <FieldValue>{formatLocation(gene.location)}</FieldValue>
        </FieldList>
      </DetailSection>
    </Fragment>
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
    <SectionHero
      breadcrumbs={GENES_BREADCRUMBS}
      head="Gene"
      subHead={message}
    />
  );
};
