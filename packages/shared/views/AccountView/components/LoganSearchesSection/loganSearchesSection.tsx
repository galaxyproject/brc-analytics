import { Button, Link as MuiLink } from "@mui/material";
import { apiClient } from "@repo/shared/services/api-client/api-client";
import type { LoganSearchRecord } from "@repo/shared/services/api-client/types";
import { AccountCard } from "@repo/shared/views/AccountView/components/AccountCard/accountCard";
import { AccountSection } from "@repo/shared/views/AccountView/components/AccountSection/accountSection";
import { type JSX, useState } from "react";
import type { Props } from "./types";

const LOGAN_SEARCH_PATH = "/logan-search";
const INDEXES_SHOWN = 3;

/**
 * The indexes a search ran against, short enough for one line.
 * @param indexes - Index names as submitted.
 * @returns e.g. "GENOMIC_INV, GENOMIC_BCT and 4 more".
 */
function describeIndexes(indexes: string[]): string {
  if (indexes.length <= INDEXES_SHOWN) return indexes.join(", ");
  const rest = indexes.length - INDEXES_SHOWN;
  return `${indexes.slice(0, INDEXES_SHOWN).join(", ")} and ${rest} more`;
}

/**
 * Append a page, skipping jobs already listed: a search submitted between two
 * page loads shifts every offset by one, which would repeat a row.
 * @param loaded - Searches already listed.
 * @param page - The page just fetched.
 * @returns The combined list.
 */
function appendPage(
  loaded: LoganSearchRecord[],
  page: LoganSearchRecord[]
): LoganSearchRecord[] {
  const seen = new Set(loaded.map((search) => search.job_id));
  return [...loaded, ...page.filter((search) => !seen.has(search.job_id))];
}

/**
 * Logan searches this user ran while signed in, each linking back to its
 * results.
 * @param props - Component props.
 * @param props.resource - Searches loaded so far, owned by AccountView.
 * @param props.total - How many searches the user has in all.
 * @returns the section element.
 */
export function LoganSearchesSection({ resource, total }: Props): JSX.Element {
  const { error, isLoading, items, setItems } = resource;
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [moreError, setMoreError] = useState<Error | null>(null);

  const loadMore = async (): Promise<void> => {
    setIsLoadingMore(true);
    setMoreError(null);
    try {
      const page = await apiClient.getLoganSearches(items.length);
      setItems((loaded) => appendPage(loaded, page.searches));
    } catch (err) {
      setMoreError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoadingMore(false);
    }
  };

  return (
    <AccountSection
      action={
        items.length < total ? (
          <Button disabled={isLoadingMore} onClick={loadMore} size="small">
            {isLoadingMore ? "Loading..." : "Show more"}
          </Button>
        ) : undefined
      }
      count={total}
      emptyState={null}
      error={error ?? moreError}
      id="logan-searches"
      isLoading={isLoading}
      title="Logan searches"
    >
      {items.length > 0
        ? items.map((search) => (
            <AccountCard
              actions={
                <MuiLink
                  href={`${LOGAN_SEARCH_PATH}?job=${encodeURIComponent(search.job_id)}`}
                  underline="hover"
                >
                  Open results
                </MuiLink>
              }
              key={search.job_id}
              subtitle={`${search.query_bases.toLocaleString()} bases at threshold ${search.threshold.toFixed(2)} -- ${describeIndexes(search.indexes)}`}
              title={`Searched ${new Date(search.created_at).toLocaleString()}`}
            />
          ))
        : undefined}
    </AccountSection>
  );
}
