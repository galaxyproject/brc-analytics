import { LoganHero } from "@logan/components/layout/LoganHero/loganHero";
import { editSearchHref, resultsHref, ROUTES } from "@logan/routes/constants";
import { Link } from "@mui/material";
import {
  LoganSearchForm,
  type LoganSearchFormInitial,
} from "@repo/shared/components/LoganSearch/LoganSearchForm/loganSearchForm";
import {
  readRecentSearches,
  type RecentSearch,
} from "@repo/shared/components/LoganSearch/LoganSearchHistory/recentSearches";
import { useRecentSearches } from "@repo/shared/components/LoganSearch/LoganSearchHistory/useRecentSearches";
import { LoganSearchStatus } from "@repo/shared/components/LoganSearch/LoganSearchStatus/loganSearchStatus";
import { useKmindexSearch } from "@repo/shared/hooks/useKmindexSearch";
import NextLink from "next/link";
import { useRouter } from "next/router";
import { Fragment, type JSX, useCallback, useEffect, useState } from "react";
import { LOGAN_STATS } from "./constants";
import { SearchContainer, SearchSection } from "./loganSearchSiteView.styles";

interface LoganSearchStartProps {
  initial?: LoganSearchFormInitial;
}

/**
 * The form, and where a submit that fails says why. A submit that works goes
 * straight to its results page.
 * @param props - Component props.
 * @param props.initial - The search being edited, if any.
 * @returns The form.
 */
const LoganSearchStart = ({ initial }: LoganSearchStartProps): JSX.Element => {
  const router = useRouter();
  const search = useKmindexSearch();
  const { record } = useRecentSearches();

  const onSubmitted = useCallback(
    (entry: RecentSearch): void => {
      record(entry);
      // Leave this page as the edit link first, so Back from the results
      // returns to the form as it was submitted rather than the sample query.
      router
        .replace(editSearchHref(entry.jobId), undefined, { shallow: true })
        .then(() => router.push(resultsHref(entry.jobId)))
        .catch(() => undefined);
    },
    [record, router]
  );

  return (
    <Fragment>
      <LoganSearchForm
        initial={initial}
        onSubmitted={onSubmitted}
        search={search}
      />
      <LoganSearchStatus search={search} />
    </Fragment>
  );
};

/**
 * The search a ?edit= link names, if this browser still has its query.
 * @param jobId - The job to edit.
 * @returns The form's starting values, or undefined to start fresh.
 */
function storedSearch(
  jobId: string | null
): LoganSearchFormInitial | undefined {
  if (!jobId) return undefined;
  const stored = readRecentSearches();
  if (stored.status !== "ok") return undefined;
  const entry = stored.searches.find((search) => search.jobId === jobId);
  if (!entry?.sequence) return undefined;
  return {
    indexes: entry.indexes,
    sequence: entry.sequence,
    threshold: entry.threshold,
  };
}

/**
 * The site's home page: a short hero, with the search form riding up over its
 * bottom edge. Results have their own page; a link from before they did
 * (?job= here) is sent on to it.
 * @returns the search page.
 */
export const LoganSearchSiteView = (): JSX.Element => {
  const router = useRouter();
  // Null until the URL has been read, which can only happen after mount on a
  // statically exported page.
  const [start, setStart] = useState<{
    initial?: LoganSearchFormInitial;
  } | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("job")) {
      // The whole query string, so filters on an old shared link survive.
      router
        .replace(`${ROUTES.RESULTS}${window.location.search}`)
        .catch(() => undefined);
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- the URL and storage are only readable after mount
    setStart({ initial: storedSearch(params.get("edit")) });
    // Mount only: the form reads its starting values once.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional mount-only read
  }, []);

  return (
    <Fragment>
      <LoganHero
        head="Logan Search"
        stats={LOGAN_STATS}
        subHead={
          <Fragment>
            Paste a DNA sequence and find the SRA runs it occurs in.{" "}
            <Link component={NextLink} href={ROUTES.LEARN}>
              How it works
            </Link>
          </Fragment>
        }
        variant="home"
      />
      <SearchSection>
        <SearchContainer>
          {start && <LoganSearchStart initial={start.initial} />}
        </SearchContainer>
      </SearchSection>
    </Fragment>
  );
};
