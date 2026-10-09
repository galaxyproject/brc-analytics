import { Breadcrumbs } from "@databiosphere/findable-ui/lib/components/common/Breadcrumbs/breadcrumbs";
import { type JSX } from "react";
import { ContigMotif } from "./components/ContigMotif/contigMotif";
import { Head, HeroBand, HeroLayout, Stats, Subhead } from "./loganHero.styles";
import type { Props } from "./types";

// Middle dots rather than dashes, which the site's copy keeps out of headings.
const STATS_SEPARATOR = " · ";

/**
 * The site's page band: title, optional breadcrumbs, subhead and a line of
 * facts, over a faint field of contig bars.
 * @param props - Hero props.
 * @param props.breadcrumbs - Breadcrumbs above the title, if any.
 * @param props.head - Page title.
 * @param props.stats - Short facts shown on one line under the subhead.
 * @param props.subHead - One line under the title.
 * @param props.variant - Home (search page) or article (docs) layout.
 * @returns the hero band.
 */
export const LoganHero = ({
  breadcrumbs,
  head,
  stats,
  subHead,
  variant,
}: Props): JSX.Element => {
  return (
    <HeroBand>
      <ContigMotif />
      <HeroLayout variant={variant}>
        {breadcrumbs && breadcrumbs.length > 0 && (
          <Breadcrumbs breadcrumbs={breadcrumbs} />
        )}
        <Head variant={variant}>{head}</Head>
        {subHead && <Subhead>{subHead}</Subhead>}
        {stats && stats.length > 0 && (
          <Stats>{stats.join(STATS_SEPARATOR)}</Stats>
        )}
      </HeroLayout>
    </HeroBand>
  );
};
