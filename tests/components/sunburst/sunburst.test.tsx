import { createAppTheme } from "@databiosphere/findable-ui/lib/theme/theme";
import { ThemeProvider } from "@mui/material";
import { Sunburst } from "@repo/shared/views/HomeView/components/Section/components/SectionAssemblies/components/Sunburst/sunburst";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { type JSX, type ReactElement } from "react";
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
 * Renders inside the app theme, which the layout's breakpoints read.
 * @param ui - Element to render.
 * @returns The render result.
 */
function renderThemed(ui: ReactElement): ReturnType<typeof render> {
  return render(<ThemeProvider theme={createAppTheme()}>{ui}</ThemeProvider>);
}

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
    const { container } = renderThemed(
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
    const { container } = renderThemed(
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
    renderThemed(
      <Sunburst
        loadData={() => Promise.reject(new Error("offline"))}
        logoPath="/logo.svg"
      />
    );
    expect(
      await screen.findByText("The taxonomy chart could not be loaded.")
    ).toBeTruthy();
  });

  it("offers the panel's subcategories as buttons", async () => {
    renderThemed(
      <Sunburst
        loadData={() => Promise.resolve(sampleTree())}
        logoPath="/logo.svg"
      />
    );
    // The chart's first-ring arcs are buttons too; this wants the panel's.
    await waitFor(() =>
      expect(
        screen
          .getAllByRole("button", { name: /^Alpha/ })
          .some((element) => element.tagName === "BUTTON")
      ).toBe(true)
    );
  });

  it("lets the keyboard zoom in on a first-ring arc and back out", async () => {
    const { container } = renderThemed(
      <Sunburst
        loadData={() => Promise.resolve(sampleTree())}
        logoPath="/logo.svg"
      />
    );
    const chart = await screen.findByRole("group", {
      name: "Assemblies by taxonomic lineage",
    });
    const beta = within(chart).getByRole("button", {
      name: "Beta, domain · 1 assembly",
    });
    expect(beta.getAttribute("tabindex")).toBe("0");
    fireEvent.keyDown(beta, { key: "Enter" });
    expect(chart.getAttribute("aria-label")).toBe(
      "Assemblies by taxonomic lineage, centred on Beta"
    );
    const zoomOut = within(chart).getByRole("button", {
      name: "Zoom out to All taxa",
    });
    expect(document.activeElement).toBe(zoomOut);
    await waitFor(() => expect(arcs(container)).toHaveLength(3), {
      timeout: 3000,
    });
    fireEvent.keyDown(zoomOut, { key: " " });
    expect(chart.getAttribute("aria-label")).toBe(
      "Assemblies by taxonomic lineage"
    );
  });

  it("shows the lineage of the centred taxon with links back up it", async () => {
    renderThemed(
      <Sunburst
        loadData={() => Promise.resolve(sampleTree())}
        logoPath="/logo.svg"
        startingNode="c-0"
      />
    );
    const lineage = await screen.findByRole("navigation", { name: "Lineage" });
    expect(
      within(lineage)
        .getAllByRole("button")
        .map((button) => button.textContent)
    ).toEqual(["All taxa", "Beta"]);
    expect(screen.getByRole("heading", { name: "c-0" })).toBeTruthy();
  });

  describe("with IntersectionObserver", () => {
    let trigger: (() => void) | null = null;
    const original = window.IntersectionObserver;

    beforeEach(() => {
      trigger = null;
      window.IntersectionObserver = class {
        constructor(callback: IntersectionObserverCallback) {
          trigger = (): void =>
            callback(
              [{ isIntersecting: true } as IntersectionObserverEntry],
              this as unknown as IntersectionObserver
            );
        }
        disconnect(): void {}
        observe(): void {}
      } as unknown as typeof IntersectionObserver;
    });

    afterEach(() => {
      window.IntersectionObserver = original;
    });

    it("waits for the section to near the viewport before loading", async () => {
      const loadData = jest.fn(() => Promise.resolve(sampleTree()));
      const { container } = renderThemed(
        <Sunburst loadData={loadData} logoPath="/logo.svg" />
      );
      expect(loadData).not.toHaveBeenCalled();
      expect(container.querySelector("[aria-busy=true]")).toBeTruthy();
      act(() => trigger?.());
      expect(loadData).toHaveBeenCalledTimes(1);
      await waitFor(() => expect(arcs(container)).toHaveLength(11));
    });
  });

  it("zooms without animating when the user prefers reduced motion", async () => {
    const original = window.matchMedia;
    window.matchMedia = ((query: string) => ({
      matches: query.includes("reduce"),
    })) as unknown as typeof window.matchMedia;
    try {
      const { container } = renderThemed(
        <Sunburst
          loadData={() => Promise.resolve(sampleTree())}
          logoPath="/logo.svg"
        />
      );
      const chart = await screen.findByRole("group");
      fireEvent.keyDown(within(chart).getByRole("button", { name: /^Beta/ }), {
        key: "Enter",
      });
      // No transition to wait out: the leaving arcs are already gone.
      expect(arcs(container)).toHaveLength(3);
    } finally {
      window.matchMedia = original;
    }
  });

  it("keeps keyboard focus in the panel when its controls navigate", async () => {
    renderThemed(
      <Sunburst
        loadData={() => Promise.resolve(sampleTree())}
        logoPath="/logo.svg"
      />
    );
    const alpha = await panelRow("Alpha");
    fireEvent.click(alpha);
    const heading = screen.getByRole("heading", { name: "Subcategories" });
    expect(document.activeElement).toBe(heading);
    // Back to the root, where the back button itself goes away.
    fireEvent.click(screen.getByRole("button", { name: "Back to All taxa" }));
    expect(document.activeElement).toBe(heading);
  });

  it("places labels arriving in a zoom before the animation starts", async () => {
    const { container } = renderThemed(
      <Sunburst
        loadData={() => Promise.resolve(sampleTree())}
        logoPath="/logo.svg"
      />
    );
    fireEvent.click(await panelRow("Beta"));
    const labels = Array.from(
      container.querySelector("svg")?.querySelectorAll("text") ?? []
    ).filter((text) => text.textContent?.startsWith("c-"));
    expect(labels.length).toBeGreaterThan(0);
    for (const text of labels) {
      expect(text.getAttribute("transform")).toMatch(/^rotate\(/);
    }
  });
});
