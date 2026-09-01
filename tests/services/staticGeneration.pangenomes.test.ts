import { type Pangenome } from "@brc/apis/pangenome";

jest.mock("fs", () => ({ promises: { readFile: jest.fn() } }));

const PANGENOME = {
  bundleId: "pv-v1",
  members: [],
  speciesTaxonomyId: "5855",
  version: "2026-05",
} as Pangenome;

const PANGENOMES_STATIC_LOAD_FILE = "catalog/output/pangenomes.json";

describe("loadPangenomes", () => {
  test("keys the pangenomes by species taxonomy ID", async () => {
    const { loadPangenomes, readFile } = await freshModule();
    readFile.mockResolvedValue(JSON.stringify([PANGENOME]));

    const pangenomes = await loadPangenomes();

    expect(readFile).toHaveBeenCalledWith(PANGENOMES_STATIC_LOAD_FILE, "utf8");
    expect(pangenomes.get("5855")).toEqual(PANGENOME);
  });

  test("memoizes the read across calls", async () => {
    const { loadPangenomes, readFile } = await freshModule();
    readFile.mockResolvedValue(JSON.stringify([]));

    await Promise.all([loadPangenomes(), loadPangenomes()]);
    await loadPangenomes();

    expect(readFile).toHaveBeenCalledTimes(1);
  });

  test("yields an empty map when the catalog is absent", async () => {
    const { loadPangenomes, readFile, warn } = await freshModule();
    const error: NodeJS.ErrnoException = new Error("no such file");
    error.code = "ENOENT";
    readFile.mockRejectedValue(error);

    await expect(loadPangenomes()).resolves.toEqual(new Map());
    // Loud: the section disappears from every organism page, so a silent
    // degrade would ship unnoticed.
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining(PANGENOMES_STATIC_LOAD_FILE),
      error
    );
  });

  test("yields an empty map when the payload is not an array", async () => {
    const { loadPangenomes, readFile, warn } = await freshModule();
    readFile.mockResolvedValue(JSON.stringify({}));

    await expect(loadPangenomes()).resolves.toEqual(new Map());
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining(PANGENOMES_STATIC_LOAD_FILE),
      expect.objectContaining({
        message: `Pangenomes catalog is not an array: ${PANGENOMES_STATIC_LOAD_FILE}`,
      })
    );
  });

  test("memoizes the degraded read rather than retrying every page", async () => {
    const { loadPangenomes, readFile } = await freshModule();
    readFile.mockRejectedValue(new Error("read failed"));

    await expect(loadPangenomes()).resolves.toEqual(new Map());
    await expect(loadPangenomes()).resolves.toEqual(new Map());

    // An absent catalog stays absent for the build, so re-reading it once per
    // page would buy nothing but ~2K failed reads.
    expect(readFile).toHaveBeenCalledTimes(1);
  });
});

/**
 * Re-imports the module under test so each case starts with an empty read memo
 * (the memo is module state, keyed by nothing but the module instance).
 * @returns The reader under test, the mocked readFile bound to it, and a
 * silenced console.warn spy.
 */
async function freshModule(): Promise<{
  loadPangenomes: () => Promise<Map<string, Pangenome>>;
  readFile: jest.Mock;
  warn: jest.SpyInstance;
}> {
  jest.resetModules();
  const { promises } = await import("fs");
  const { loadPangenomes } =
    await import("@brc/services/staticGeneration/organism/pangenomes");
  const warn = jest.spyOn(console, "warn").mockImplementation(() => undefined);
  return { loadPangenomes, readFile: promises.readFile as jest.Mock, warn };
}
