import {
  downloadMapImage,
  EXPORT_BACKGROUND,
  mapImageFilename,
  type MapImageView,
  PNG_SCALE,
  renderMapImage,
} from "@brc/components/LoganSearch/CohortGeography/mapImage";

/**
 * A stand-in for the embedded vega view that records what the export did to
 * it. jsdom cannot run vega's renderers, and the background handling is the
 * part that can actually go wrong.
 * @param toImageURL - What rendering resolves (or rejects) with.
 * @returns The stub and the backgrounds it was set to, in order.
 */
function stubView(toImageURL: jest.Mock): {
  backgrounds: string[];
  runAsync: jest.Mock;
  view: MapImageView;
} {
  let background = "transparent";
  const backgrounds: string[] = [];
  const runAsync = jest.fn(async () => undefined);
  const view = {
    background: (next?: string): string | unknown => {
      if (next === undefined) return background;
      background = next;
      backgrounds.push(next);
      return view;
    },
    runAsync,
    toImageURL,
  } as unknown as MapImageView;
  return { backgrounds, runAsync, view };
}

describe("mapImageFilename", () => {
  it("names the file after the job", () => {
    expect(mapImageFilename("fe6f66a714dcbec8", "png")).toBe(
      "logan-fe6f66a714dcbec8-map.png"
    );
    expect(mapImageFilename("fe6f66a714dcbec8", "svg")).toBe(
      "logan-fe6f66a714dcbec8-map.svg"
    );
  });

  it("falls back to a generic name without a job", () => {
    expect(mapImageFilename(null, "png")).toBe("logan-map.png");
    expect(mapImageFilename(undefined, "svg")).toBe("logan-map.svg");
    expect(mapImageFilename("", "png")).toBe("logan-map.png");
  });

  it("keeps a job id from the URL from escaping the filename", () => {
    // ?job= is user-controlled, so separators and dots must not survive.
    expect(mapImageFilename("../../etc/passwd", "png")).toBe(
      "logan-etc-passwd-map.png"
    );
    expect(mapImageFilename("a b/c\\d", "svg")).toBe("logan-a-b-c-d-map.svg");
    expect(mapImageFilename("///", "png")).toBe("logan-map.png");
  });

  it("caps a pathological job id", () => {
    const name = mapImageFilename("x".repeat(500), "png");
    expect(name).toBe(`logan-${"x".repeat(64)}-map.png`);
  });
});

describe("renderMapImage", () => {
  it("renders PNG at twice the on-screen size", async () => {
    const toImageURL = jest.fn(async () => "data:image/png;base64,AAAA");
    const { view } = stubView(toImageURL);

    await expect(renderMapImage(view, "png")).resolves.toBe(
      "data:image/png;base64,AAAA"
    );
    expect(toImageURL).toHaveBeenCalledWith("png", PNG_SCALE);
  });

  it("renders SVG at its natural size", async () => {
    const toImageURL = jest.fn(async () => "blob:svg");
    const { view } = stubView(toImageURL);

    await renderMapImage(view, "svg");
    expect(toImageURL).toHaveBeenCalledWith("svg", 1);
  });

  it("paints the export opaque and gives the live map its background back", async () => {
    const { backgrounds, runAsync, view } = stubView(
      jest.fn(async () => "blob:svg")
    );

    await renderMapImage(view, "svg");
    expect(backgrounds).toEqual([EXPORT_BACKGROUND, "transparent"]);
    expect(view.background()).toBe("transparent");
    expect(runAsync).toHaveBeenCalled();
  });

  it("restores the background even when the render fails", async () => {
    const { view } = stubView(
      jest.fn(async () => {
        throw new Error("canvas tainted");
      })
    );

    await expect(renderMapImage(view, "png")).rejects.toThrow("canvas tainted");
    expect(view.background()).toBe("transparent");
  });
});

describe("downloadMapImage", () => {
  let click: jest.SpyInstance;
  let clicked: { download: string; href: string }[];

  beforeEach(() => {
    jest.useFakeTimers();
    clicked = [];
    click = jest
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(function (this: HTMLAnchorElement) {
        clicked.push({ download: this.download, href: this.href });
      });
    // jsdom has no object URLs.
    URL.revokeObjectURL = jest.fn();
  });

  afterEach(() => {
    click.mockRestore();
    jest.useRealTimers();
  });

  it("clicks a download link with the job's filename", async () => {
    const { view } = stubView(jest.fn(async () => "data:image/png;base64,AA"));

    await downloadMapImage(view, "png", "fe6f66a714dcbec8");
    expect(clicked).toEqual([
      {
        download: "logan-fe6f66a714dcbec8-map.png",
        href: "data:image/png;base64,AA",
      },
    ]);
    // The link is a means to an end, not something left in the page.
    expect(document.querySelector("a[download]")).toBeNull();
  });

  it("releases the SVG blob once the download has started", async () => {
    const { view } = stubView(jest.fn(async () => "blob:http://x/abc"));

    await downloadMapImage(view, "svg", null);
    expect(clicked[0].download).toBe("logan-map.svg");
    expect(URL.revokeObjectURL).not.toHaveBeenCalled();
    jest.runAllTimers();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:http://x/abc");
  });

  it("does not try to revoke a PNG data URL", async () => {
    const { view } = stubView(jest.fn(async () => "data:image/png;base64,AA"));

    await downloadMapImage(view, "png", null);
    jest.runAllTimers();
    expect(URL.revokeObjectURL).not.toHaveBeenCalled();
  });
});
