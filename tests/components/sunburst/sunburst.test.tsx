import { Sunburst } from "@repo/shared/views/HomeView/components/Section/components/SectionAssemblies/components/Sunburst/sunburst";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { type JSX } from "react";
import { sampleTree } from "./fixtures";

// The real link validates its URL against the explore state the app
// provides, which these tests don't set up.
jest.mock(
  "@databiosphere/findable-ui/lib/components/Links/components/Link/link",
  () => ({
    Link: ({ label }: { label: string }): JSX.Element => <a>{label}</a>,
  })
);

/**
 * Arcs currently drawn in the chart (the first svg; the panel's icons are
 * svgs too).
 * @param container - Rendered container.
 * @returns The arc paths.
 */
function arcs(container: HTMLElement): SVGPathElement[] {
  return Array.from(
    container.querySelector("svg")?.querySelectorAll("path") ?? []
  );
}

/**
 * A subcategory in the details panel (the chart labels share its text).
 * @param name - Taxon name.
 * @returns The panel entry.
 */
function panelRow(name: string): Promise<HTMLElement> {
  return waitFor(() => {
    const row = screen
      .getAllByText(name)
      .find((element) => !element.closest("svg"));
    if (!row) throw new Error(`No panel entry for ${name}`);
    return row;
  });
}

describe("Sunburst", () => {
  it("draws only the arcs in view, not the whole tree", async () => {
    const { container } = render(
      <Sunburst
        loadData={() => Promise.resolve(sampleTree())}
        logoPath="/logo.svg"
      />
    );
    // Three domains, two/one/one chains below them: rings 1-3 hold
    // 3 + 4 + 4 nodes; the 15 deeper ones are left out of the DOM.
    await waitFor(() => expect(arcs(container)).toHaveLength(11));
  });

  it("swaps the drawn arcs for the new subtree when zooming in", async () => {
    const { container } = render(
      <Sunburst
        loadData={() => Promise.resolve(sampleTree())}
        logoPath="/logo.svg"
      />
    );
    fireEvent.click(await panelRow("Beta"));
    // Beta's three visible descendants remain once the leaving arcs have
    // animated out.
    await waitFor(() => expect(arcs(container)).toHaveLength(3), {
      timeout: 3000,
    });
  });

  it("says so if the chart can't be loaded", async () => {
    render(
      <Sunburst
        loadData={() => Promise.reject(new Error("offline"))}
        logoPath="/logo.svg"
      />
    );
    expect(
      await screen.findByText("The taxonomy chart could not be loaded.")
    ).toBeTruthy();
  });
});
