import { GenesPanel } from "@brc/components/Genes/genes.styles";
import { Link } from "@databiosphere/findable-ui/lib/components/Links/components/Link/link";
import { TYPOGRAPHY_PROPS } from "@databiosphere/findable-ui/lib/styles/common/mui/typography";
import { Slider, Typography } from "@mui/material";
import {
  type BionymClaim,
  type BionymSource,
} from "@repo/shared/services/genes/types";
import { formatDate } from "@repo/shared/utils/date-fns/utils";
import { SectionTitle } from "@repo/shared/views/EntityView/ui/SectionTitle/sectionTitle";
import { parseISO } from "date-fns";
import {
  type JSX,
  memo,
  useDeferredValue,
  useId,
  useMemo,
  useState,
} from "react";
import {
  Claim,
  ClaimList,
  ConfidenceControl,
  Quote,
  Source,
  SourceList,
} from "./bionymSection.styles";
import {
  BIONYM_URL,
  DEFAULT_MIN_CONFIDENCE,
  SOURCE_KIND_LABEL,
} from "./constants";
import { type BionymSectionProps } from "./types";
import { countClaims, formatConfidence, visibleSources } from "./utils";

/**
 * The claims BioNym drew about a gene, grouped by source, with a slider that
 * sets the lowest confidence shown. Kept apart from the gene's facts, and
 * labelled as BioNym's scored judgments.
 * @param props - Component props.
 * @param props.bionym - The claims in the gene's BioNym graph.
 * @returns The section.
 */
export const BionymSection = ({ bionym }: BionymSectionProps): JSX.Element => {
  const headingId = useId();
  const sliderLabelId = useId();
  const [minConfidence, setMinConfidence] = useState(DEFAULT_MIN_CONFIDENCE);
  // The list follows the slider without holding up its drag: a gene can have
  // over a thousand claims, and the list is memoized, so a slider move
  // re-renders it only once the deferred value catches up.
  const deferredMinConfidence = useDeferredValue(minConfidence);
  const totalCount = countClaims(bionym.sources);
  const sources = useMemo(
    () => visibleSources(bionym.sources, deferredMinConfidence),
    [bionym, deferredMinConfidence]
  );
  const shownCount = countClaims(sources);

  return (
    <GenesPanel aria-labelledby={headingId} as="section">
      <SectionTitle
        component="h2"
        id={headingId}
        variant={TYPOGRAPHY_PROPS.VARIANT.HEADING_SMALL}
      >
        Evidence gathered by BioNym
      </SectionTitle>
      <Typography variant={TYPOGRAPHY_PROPS.VARIANT.BODY_400_2_LINES}>
        These claims about the gene were drawn from papers and datasets by a
        language model, and each was scored by{" "}
        <Link label="BioNym" url={BIONYM_URL} /> with a confidence from 0 to 1.
        They are BioNym&apos;s judgments, not facts about the gene. BioNym
        gathered them on {formatDate(parseISO(bionym.runDate))}.
      </Typography>
      <ConfidenceControl>
        <Typography
          id={sliderLabelId}
          variant={TYPOGRAPHY_PROPS.VARIANT.BODY_500}
        >
          Minimum confidence
        </Typography>
        <Slider
          aria-labelledby={sliderLabelId}
          max={1}
          min={0}
          onChange={(_, value): void => setMinConfidence(value as number)}
          size="small"
          step={0.01}
          value={minConfidence}
          valueLabelDisplay="auto"
        />
        <Typography
          color={TYPOGRAPHY_PROPS.COLOR.INK_LIGHT}
          variant={TYPOGRAPHY_PROPS.VARIANT.BODY_400}
        >
          {shownCount} of {totalCount} claims
        </Typography>
      </ConfidenceControl>
      <SourceListView sources={sources} />
    </GenesPanel>
  );
};

/**
 * The sources shown, each with its claims. Memoized, so a slider move doesn't
 * re-render it until the sources shown change.
 * @param props - Component props.
 * @param props.sources - The sources to show, each with the claims to show.
 * @returns The list.
 */
const SourceListView = memo(function SourceListView({
  sources,
}: {
  sources: BionymSource[];
}): JSX.Element {
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

/**
 * One claim, with its confidence and quote. Memoized: filtering keeps each
 * claim object, so a slider move renders only the claims it adds.
 * @param props - Component props.
 * @param props.claim - The claim.
 * @returns The claim.
 */
const ClaimItem = memo(function ClaimItem({
  claim,
}: {
  claim: BionymClaim;
}): JSX.Element {
  return (
    <Claim>
      <Typography variant={TYPOGRAPHY_PROPS.VARIANT.BODY_400}>
        {claim.text}{" "}
        <Typography
          color={TYPOGRAPHY_PROPS.COLOR.INK_LIGHT}
          component="span"
          variant={TYPOGRAPHY_PROPS.VARIANT.BODY_SMALL_400}
        >
          (confidence {formatConfidence(claim.confidence)})
        </Typography>
      </Typography>
      <Quote>
        <Typography variant={TYPOGRAPHY_PROPS.VARIANT.BODY_SMALL_400}>
          {claim.quote}
        </Typography>
      </Quote>
    </Claim>
  );
});
