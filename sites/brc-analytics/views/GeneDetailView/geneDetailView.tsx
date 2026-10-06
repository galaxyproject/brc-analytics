import { replaceParameters } from "@databiosphere/findable-ui/lib/utils/replaceParameters";
import { sanitizeEntityId } from "@repo/shared/apis/utils";
import { SectionHero } from "@repo/shared/components/layout/SectionHero/sectionHero";
import { ROUTES } from "@repo/shared/routes/constants";
import { type GeneRecord } from "@repo/shared/services/genes/types";
import Link from "next/link";
import { Fragment, type JSX } from "react";
import {
  DetailSection,
  FieldLabel,
  FieldList,
  FieldValue,
} from "./geneDetailView.styles";

interface GeneDetailViewProps {
  gene: GeneRecord;
  title: string;
}

export const GeneDetailView = ({
  gene,
  title,
}: GeneDetailViewProps): JSX.Element => {
  const assemblyHref = replaceParameters(ROUTES.GENOME, {
    entityId: sanitizeEntityId(gene.assemblyAccession),
  });
  const breadcrumbs = [
    { path: "/", text: "Home" },
    { path: ROUTES.GENES, text: "Genes" },
    { path: "", text: gene.geneId },
  ];

  return (
    <Fragment>
      <SectionHero
        breadcrumbs={breadcrumbs}
        head={title}
        subHead={gene.product}
      />
      <DetailSection>
        <FieldList>
          <FieldLabel>Gene ID</FieldLabel>
          <FieldValue>{gene.geneId}</FieldValue>
          <FieldLabel>Symbol</FieldLabel>
          <FieldValue>{gene.symbol || "—"}</FieldValue>
          <FieldLabel>Product</FieldLabel>
          <FieldValue>{gene.product}</FieldValue>
          <FieldLabel>Organism</FieldLabel>
          <FieldValue>{gene.organism}</FieldValue>
          <FieldLabel>Assembly</FieldLabel>
          <FieldValue>
            <Link href={assemblyHref}>{gene.assemblyAccession}</Link>
          </FieldValue>
          <FieldLabel>Location</FieldLabel>
          <FieldValue>{gene.location}</FieldValue>
        </FieldList>
      </DetailSection>
    </Fragment>
  );
};
