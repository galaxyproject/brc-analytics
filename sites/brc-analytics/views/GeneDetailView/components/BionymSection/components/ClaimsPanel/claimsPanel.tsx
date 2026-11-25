import {
  ClaimList,
  Source,
  SourceList,
} from "@brc/views/GeneDetailView/components/BionymSection/bionymSection.styles";
import { ConfidenceControl } from "@brc/views/GeneDetailView/components/BionymSection/components/ConfidenceControl/confidenceControl";
import { SOURCE_KIND_LABEL } from "@brc/views/GeneDetailView/components/BionymSection/constants";
import {
  countClaims,
  formatConfidence,
  visibleSources,
} from "@brc/views/GeneDetailView/components/BionymSection/utils";
import { Link } from "@databiosphere/findable-ui/lib/components/Links/components/Link/link";
import { TYPOGRAPHY_PROPS } from "@databiosphere/findable-ui/lib/styles/common/mui/typography";
import { Typography } from "@mui/material";
import { Tooltip } from "@repo/shared/components/Tooltip/tooltip";
import { type JSX, memo, useDeferredValue, useMemo } from "react";
import {
  type ClaimItemProps,
  type ClaimsPanelProps,
  type SourceListViewProps,
} from "./types";

/**
 * The Claims tab: the claims BioNym drew about the gene, grouped by source,
 * at or above the section's minimum confidence.
 * @param props - Component props.
 * @param props.bionym - The claims in the gene's BioNym graph.
 * @param props.minConfidence - The lowest confidence shown.
 * @param props.onMinConfidenceChange - Called with a new minimum confidence.
 * @returns The panel.
 */
export const ClaimsPanel = ({
  bionym,
  minConfidence,
  onMinConfidenceChange,
}: ClaimsPanelProps): JSX.Element => {
  // The list follows the slider without holding up its drag: a gene can have
  // over a thousand claims, and the list is memoized, so a slider move
  // re-renders it only once the deferred value catches up.
  const deferredMinConfidence = useDeferredValue(minConfidence);
  const totalCount = countClaims(bionym.sources);
  const sources = useMemo(
    () => visibleSources(bionym.sources, deferredMinConfidence),
    [bionym, deferredMinConfidence]
  );
  return (
    <>
      <Typography variant={TYPOGRAPHY_PROPS.VARIANT.BODY_400_2_LINES}>
        Hover over a claim to see the quote it was drawn from.
      </Typography>
      <ConfidenceControl
        count={`${countClaims(sources)} of ${totalCount} claims`}
        minConfidence={minConfidence}
        onMinConfidenceChange={onMinConfidenceChange}
      />
      <SourceListView sources={sources} />
    </>
  );
};

/**
 * One claim, showing its text and confidence, with its quote in a tooltip on
 * hover. Memoized: filtering keeps each claim object, so a slider move
 * renders only the claims it adds.
 * @param props - Component props.
 * @param props.claim - The claim.
 * @returns The claim.
 */
const ClaimItem = memo(function ClaimItem({
  claim,
}: ClaimItemProps): JSX.Element {
  return (
    <li>
      {/* describeChild keeps the claim text as the item's accessible name, with
          the quote as its description, rather than the quote replacing it. */}
      <Tooltip arrow describeChild title={claim.quote}>
        <Typography
          component="span"
          variant={TYPOGRAPHY_PROPS.VARIANT.BODY_400}
        >
          {claim.text}{" "}
          <Typography
            color={TYPOGRAPHY_PROPS.COLOR.INK_LIGHT}
            component="span"
            variant={TYPOGRAPHY_PROPS.VARIANT.BODY_SMALL_400}
          >
            (confidence {formatConfidence(claim.confidence)})
          </Typography>
        </Typography>
      </Tooltip>
    </li>
  );
});

/**
 * The sources shown, each with its claims. Memoized, so a slider move doesn't
 * re-render it until the sources shown change.
 * @param props - Component props.
 * @param props.sources - The sources to show, each with the claims to show.
 * @returns The list.
 */
const SourceListView = memo(function SourceListView({
  sources,
}: SourceListViewProps): JSX.Element {
  return (
    <SourceList>
      {sources.map((source) => (
        <Source key={source.id}>
          <Typography
            component="h3"
            variant={TYPOGRAPHY_PROPS.VARIANT.BODY_500}
          >
            {source.url ? (
              <Link label={source.title} url={source.url} />
            ) : (
              source.title
            )}
          </Typography>
          <Typography
            color={TYPOGRAPHY_PROPS.COLOR.INK_LIGHT}
            variant={TYPOGRAPHY_PROPS.VARIANT.BODY_SMALL_400}
          >
            {SOURCE_KIND_LABEL[source.kind]}
          </Typography>
          <ClaimList>
            {source.claims.map((claim) => (
              <ClaimItem claim={claim} key={claim.text} />
            ))}
          </ClaimList>
        </Source>
      ))}
    </SourceList>
  );
});
