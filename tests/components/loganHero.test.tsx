import { LoganHero } from "@logan/components/layout/LoganHero/loganHero";
import { createLoganTheme } from "@logan/theme/theme";
import { LOGAN_STATS } from "@logan/views/LoganSearchSiteView/constants";
import { ThemeProvider } from "@mui/material";
import { render, screen } from "@testing-library/react";
import { type ReactElement } from "react";

/**
 * Renders inside the site theme, which the hero's breakpoint mixins read.
 * @param ui - Element to render.
 * @returns the render result.
 */
function renderWithTheme(ui: ReactElement): ReturnType<typeof render> {
  return render(<ThemeProvider theme={createLoganTheme()}>{ui}</ThemeProvider>);
}

describe("LoganHero", () => {
  it("puts the stats on one line, separated by middle dots", () => {
    renderWithTheme(
      <LoganHero head="Logan Search" stats={LOGAN_STATS} variant="home" />
    );
    const line = screen.getByText(LOGAN_STATS.join(" · "));
    expect(line.textContent).not.toMatch(/ -- |—/);
  });

  it("leaves out the stats line and breadcrumbs when given none", () => {
    const { container } = renderWithTheme(
      <LoganHero head="How Logan Search works" variant="article" />
    );
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe(
      "How Logan Search works"
    );
    expect(container.querySelectorAll("p")).toHaveLength(0);
    expect(container.querySelector("nav")).toBeNull();
  });

  it("keeps the motif out of the accessibility tree", () => {
    const { container } = renderWithTheme(
      <LoganHero head="Logan Search" variant="home" />
    );
    expect(container.querySelector("svg")?.getAttribute("aria-hidden")).toBe(
      "true"
    );
  });
});
