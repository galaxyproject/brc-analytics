import brcConfig from "../../site-config/brc-analytics/local/config";
import ga2Config from "../../site-config/ga2/local/config";

// The brc config chain pulls in FavoriteButton -> the favorites provider ->
// the real api-client -> ky, an ESM-only package Jest can't parse. Stub it
// out, as the sibling favorite-component tests do; nothing here calls it.
jest.mock("@repo/shared/services/api-client/api-client", () => ({
  apiClient: {
    createFavorite: jest.fn(),
    deleteFavorite: jest.fn(),
    getFavorites: jest.fn(),
  },
}));

// The priority-pathogens entity config wires in MDXSection, which pulls in
// next-mdx-remote -- another ESM-only package Jest can't parse. Stub it;
// this suite never renders it.
jest.mock(
  "../../sites/brc-analytics/views/PriorityPathogenView/ui/Section/MDXSection/mdxSection",
  () => ({
    MDXSection: (): null => null,
  })
);

describe("loginEnabled site config", () => {
  test("ga2 does not enable login, so no account UI can render there", () => {
    expect(ga2Config.loginEnabled).toBe(false);
  });

  test("brc exposes loginEnabled so the account UI can be gated on it", () => {
    expect(typeof brcConfig.loginEnabled).toBe("boolean");
  });
});
