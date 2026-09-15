import WorkflowRunsRedirectPage from "@brc/pages/account/workflow-runs";
import SavedAnalysesRedirectPage from "@brc/pages/assistant/saved";
import FavoritesRedirectPage from "@brc/pages/data/favorites";
import { render, screen } from "@testing-library/react";
// jest-dom matchers (toBeInTheDocument, toHaveAttribute) aren't registered
// globally in this repo's jest config; opt in locally as the sibling account
// suites do.
import "@testing-library/jest-dom";
import { type JSX } from "react";

const replace = jest.fn().mockResolvedValue(undefined);
jest.mock("next/router", () => ({
  useRouter: (): { replace: jest.Mock } => ({ replace }),
}));

describe.each([
  ["data/favorites", FavoritesRedirectPage, "/account#assemblies"],
  ["assistant/saved", SavedAnalysesRedirectPage, "/account#analyses"],
  ["account/workflow-runs", WorkflowRunsRedirectPage, "/account#launches"],
] as const)(
  "%s redirect stub",
  (_name, RedirectPage: () => JSX.Element, href) => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    test("redirects to the account workspace", () => {
      render(<RedirectPage />);

      expect(replace).toHaveBeenCalledWith(href);
    });

    // The redirect above resolves before this ever paints in normal use --
    // this guards the case it doesn't (a rejected navigation, or a visitor
    // with JS disabled who never runs the effect at all), which previously
    // rendered `<></>` and left them on a blank page with no way out.
    test("renders a fallback link to the account workspace instead of nothing", () => {
      render(<RedirectPage />);

      const link = screen.getByRole("link", { name: /account workspace/i });
      expect(link).toHaveAttribute("href", href);
    });
  }
);
