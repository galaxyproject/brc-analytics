import { LayoutDimensionsProvider } from "@databiosphere/findable-ui/lib/providers/layoutDimensions/provider";
import { createAppTheme } from "@databiosphere/findable-ui/lib/theme/theme";
import { ThemeProvider } from "@mui/material";
import { WorkflowNotFound } from "@repo/shared/components/workflow/WorkflowNotFound/workflowNotFound";
import { render, screen } from "@testing-library/react";
import type { ReactElement } from "react";

/**
 * Renders the element under the app theme and layout-dimensions provider the
 * error layout reads from.
 * @param element - Element to render.
 */
function renderThemed(element: ReactElement): void {
  render(
    <ThemeProvider theme={createAppTheme()}>
      <LayoutDimensionsProvider>{element}</LayoutDimensionsProvider>
    </ThemeProvider>
  );
}

describe("WorkflowNotFound", () => {
  test("names the entity the workflow was requested for", () => {
    renderThemed(<WorkflowNotFound entityContext="assembly" href="/x" />);

    expect(
      screen.getByText(/isn't available for this assembly\./)
    ).toBeTruthy();
  });

  test("reads as a standalone workflow when no entity is given", () => {
    renderThemed(<WorkflowNotFound href="/data/workflows" />);

    expect(screen.getByText(/isn't available\. It may have/)).toBeTruthy();
    expect(screen.getByRole("link").getAttribute("href")).toBe(
      "/data/workflows"
    );
  });
});
