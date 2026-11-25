import { GenesPanel } from "@brc/components/Genes/genes.styles";
import { ClaimList } from "@brc/views/GeneDetailView/components/BionymSection/bionymSection.styles";
import {
  BIONYM_SECTION_ID,
  BIONYM_URL,
} from "@brc/views/GeneDetailView/components/BionymSection/constants";
import { formatConfidence } from "@brc/views/GeneDetailView/components/BionymSection/utils";
import { Link } from "@databiosphere/findable-ui/lib/components/Links/components/Link/link";
import { TYPOGRAPHY_PROPS } from "@databiosphere/findable-ui/lib/styles/common/mui/typography";
import { Link as MuiLink, Typography } from "@mui/material";
import { formatDate } from "@repo/shared/utils/date-fns/utils";
import { SectionTitle } from "@repo/shared/views/EntityView/ui/SectionTitle/sectionTitle";
import { parseISO } from "date-fns";
import { type JSX, useId } from "react";
import { type BionymSummaryProps } from "./types";
import { describeHidden, shownStatements } from "./utils";

/**
 * BioNym's summary of the gene, labelled as BioNym's judgments: the
 * statements at or above SUMMARY_MIN_CONFIDENCE, in BioNym's order, a count
 * of the rest, and a link to the BioNym section's evidence.
 * @param props - Component props.
 * @param props.bionym - The claims in the gene's BioNym graph, with its summary.
 * @returns The summary.
 */
export const BionymSummary = ({ bionym }: BionymSummaryProps): JSX.Element => {
  const headingId = useId();
  const statements = shownStatements(bionym.summary);
  const hiddenCount = bionym.summary.length - statements.length;

  return (
    <GenesPanel aria-labelledby={headingId} as="section">
      <SectionTitle
        component="h2"
        id={headingId}
        variant={TYPOGRAPHY_PROPS.VARIANT.HEADING_SMALL}
      >
        Summary by BioNym
      </SectionTitle>
      <Typography variant={TYPOGRAPHY_PROPS.VARIANT.BODY_400_2_LINES}>
        A language model wrote these statements from the evidence{" "}
        <Link label="BioNym" url={BIONYM_URL} /> gathered about the gene on{" "}
        {formatDate(parseISO(bionym.runDate))}, and BioNym checked each against
        that evidence, with a confidence from 0 to 1. They are BioNym&apos;s
        judgments, not facts about the gene.
      </Typography>
      {statements.length > 0 && (
        <ClaimList>
          {statements.map((statement, index) => (
            <li key={index}>
              <Typography
                component="span"
                variant={TYPOGRAPHY_PROPS.VARIANT.BODY_400}
              >
                {statement.text}{" "}
                <Typography
                  color={TYPOGRAPHY_PROPS.COLOR.INK_LIGHT}
                  component="span"
                  variant={TYPOGRAPHY_PROPS.VARIANT.BODY_SMALL_400}
                >
                  (confidence {formatConfidence(statement.confidence)})
                </Typography>
              </Typography>
            </li>
          ))}
        </ClaimList>
      )}
      <Typography variant={TYPOGRAPHY_PROPS.VARIANT.BODY_400_2_LINES}>
        {hiddenCount > 0 && `${describeHidden(hiddenCount)} `}
        <MuiLink href={`#${BIONYM_SECTION_ID}`}>
          See the evidence BioNym gathered
        </MuiLink>
        .
      </Typography>
    </GenesPanel>
  );
};
