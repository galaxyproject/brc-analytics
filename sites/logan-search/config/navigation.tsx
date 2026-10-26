import { type NavLinkItem } from "@databiosphere/findable-ui/lib/components/Layout/components/Header/components/Content/components/Navigation/navigation";
import styled from "@emotion/styled";
import { ROUTES } from "@logan/routes/constants";
import { type AppSiteConfig } from "@repo/shared/config/types";
import { type JSX } from "react";

const Count = styled.span`
  background: ${({ theme }): string => theme.palette.primary.main};
  border-radius: 999px;
  color: ${({ theme }): string => theme.palette.primary.contrastText};
  font-size: 11px;
  font-variant-numeric: tabular-nums;
  font-weight: 500;
  line-height: 18px;
  margin-left: 6px;
  padding: 0 6px;
`;

/**
 * The nav label, with how many searches are stored.
 * @param props - Component props.
 * @param props.count - Stored searches.
 * @returns The label.
 */
const MySearchesLabel = ({ count }: { count: number }): JSX.Element => (
  <span>
    My searches
    <Count aria-label={`${count} saved`}>{count}</Count>
  </span>
);

/**
 * The site config with a My searches link in the header, before Learn, once
 * this browser has a search to list. Until then there is nothing behind it.
 * @param config - The site config.
 * @param count - Searches stored in this browser.
 * @returns The config, unchanged when there are none.
 */
export function withMySearches(
  config: AppSiteConfig,
  count: number
): AppSiteConfig {
  const navigation = config.layout.header.navigation;
  if (count === 0 || !navigation) return config;
  const [left, middle = [], right] = navigation;
  const item: NavLinkItem = {
    label: <MySearchesLabel count={count} />,
    url: ROUTES.MY_SEARCHES,
  };
  const learn = middle.findIndex(({ url }) => url === ROUTES.LEARN);
  const at = learn === -1 ? middle.length : learn;
  return {
    ...config,
    layout: {
      ...config.layout,
      header: {
        ...config.layout.header,
        navigation: [
          left,
          [...middle.slice(0, at), item, ...middle.slice(at)],
          right,
        ],
      },
    },
  };
}
