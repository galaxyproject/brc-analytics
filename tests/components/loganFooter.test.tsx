import { Footer } from "@databiosphere/findable-ui/lib/components/Layout/components/Footer/footer";
import { ROUTES } from "@logan/routes/constants";
import { createLoganTheme } from "@logan/theme/theme";
import { ThemeProvider } from "@mui/material";
import loganDev from "@site-config/logan-search/dev/config";
import loganLocal from "@site-config/logan-search/local/config";
import loganProd from "@site-config/logan-search/prod/config";
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { existsSync } from "fs";
import path from "path";

// jsdom has no ResizeObserver; the footer observes its own height with one.
beforeAll(() => {
  global.ResizeObserver ??= class {
    disconnect(): void {}
    observe(): void {}
    unobserve(): void {}
  };
});

describe("Logan footer", () => {
  test.each([
    ["dev", loganDev],
    ["local", loganLocal],
    ["prod", loganProd],
  ])("links the search queue (%s)", (_, config) => {
    // The queue page is public, but nothing else on the site points at it.
    render(
      <ThemeProvider theme={createLoganTheme()}>
        <Footer {...config.layout.footer} />
      </ThemeProvider>
    );

    expect(screen.getByRole("link", { name: "Search queue" })).toHaveAttribute(
      "href",
      ROUTES.QUEUE
    );
  });

  test("the route constant points at a real page", () => {
    // Otherwise moving the page would leave the footer linking to a 404.
    expect(
      existsSync(
        path.join(__dirname, "../../sites/logan-search/pages", ROUTES.QUEUE)
      )
    ).toBe(true);
  });
});
