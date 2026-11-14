import { rethrowUnlessCancelled } from "../../sites/brc-analytics/views/GeneDetailView/components/BionymSection/utils";

describe("rethrowUnlessCancelled", () => {
  it("ignores a navigation Next cancelled for a newer one", () => {
    const cancelled = Object.assign(new Error("Cancel rendering route"), {
      cancelled: true,
    });
    expect(() => rethrowUnlessCancelled(cancelled)).not.toThrow();
  });

  it("rethrows any other error", () => {
    const failed = new Error("Failed to load script");
    expect(() => rethrowUnlessCancelled(failed)).toThrow(failed);
  });
});
