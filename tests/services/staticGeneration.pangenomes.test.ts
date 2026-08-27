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

  test("fails the build when the catalog is absent", async () => {
    const { loadPangenomes, readFile } = await freshModule();
    const error: NodeJS.ErrnoException = new Error("no such file");
    error.code = "ENOENT";
    readFile.mockRejectedValue(error);

    await expect(loadPangenomes()).rejects.toThrow("no such file");
  });

  test("fails the build when the payload is not an array", async () => {
    const { loadPangenomes, readFile } = await freshModule();
    readFile.mockResolvedValue(JSON.stringify({}));

    await expect(loadPangenomes()).rejects.toThrow(
      `Pangenomes catalog is not an array: ${PANGENOMES_STATIC_LOAD_FILE}`
    );
  });

  test("evicts a rejected read so a later call re-attempts", async () => {
    const { loadPangenomes, readFile } = await freshModule();
    readFile
      .mockRejectedValueOnce(new Error("read failed"))
      .mockResolvedValueOnce(JSON.stringify([PANGENOME]));

    await expect(loadPangenomes()).rejects.toThrow("read failed");
    await expect(loadPangenomes()).resolves.toEqual(
      new Map([["5855", PANGENOME]])
    );

    expect(readFile).toHaveBeenCalledTimes(2);
  });
});

/**
 * Re-imports the module under test so each case starts with an empty read memo
 * (the memo is module state, keyed by nothing but the module instance).
 * @returns The reader under test and the mocked readFile bound to it.
 */
async function freshModule(): Promise<{
  loadPangenomes: () => Promise<Map<string, Pangenome>>;
  readFile: jest.Mock;
}> {
  jest.resetModules();
  const { promises } = await import("fs");
  const { loadPangenomes } =
    await import("@brc/services/staticGeneration/organism/pangenomes");
  return { loadPangenomes, readFile: promises.readFile as jest.Mock };
}
