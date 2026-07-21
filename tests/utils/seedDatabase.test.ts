import { seedDatabase } from "@/utils/seedDatabase";
import type { EntityConfig } from "@databiosphere/findable-ui/lib/config/entities";
import { database } from "@databiosphere/findable-ui/lib/utils/database";
import fsp from "fs/promises";

const seed = jest.fn();

const config = (staticLoadFile: string): EntityConfig =>
  ({ label: staticLoadFile, staticLoadFile }) as unknown as EntityConfig;

// seedDatabase's cache is module-level and persists for the file's lifetime, so
// each test uses a unique entityListType key to stay isolated.
describe("seedDatabase", () => {
  let readFile: jest.Mock;

  beforeEach(() => {
    seed.mockReset();
    jest
      .spyOn(database, "get")
      .mockReturnValue({ seed } as unknown as ReturnType<typeof database.get>);
    readFile = jest.spyOn(fsp, "readFile") as unknown as jest.Mock;
    readFile.mockResolvedValue('{"a":{"id":1}}');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("reads and seeds once across repeated calls for the same entity type", async () => {
    for (let i = 0; i < 5; i++) {
      await seedDatabase("repeat", config("repeat.json"));
    }
    expect(readFile).toHaveBeenCalledTimes(1);
    expect(seed).toHaveBeenCalledTimes(1);
  });

  test("reads once per entity type", async () => {
    await seedDatabase("typeA", config("typeA.json"));
    await seedDatabase("typeB", config("typeB.json"));
    await seedDatabase("typeA", config("typeA.json"));
    expect(readFile).toHaveBeenCalledTimes(2);
  });

  test("shares a single read across a concurrent burst", async () => {
    await Promise.all(
      Array.from({ length: 10 }, () =>
        seedDatabase("burst", config("burst.json"))
      )
    );
    expect(readFile).toHaveBeenCalledTimes(1);
  });

  test("does not cache a failed read; a later call retries", async () => {
    readFile.mockRejectedValueOnce(new Error("boom"));
    await expect(seedDatabase("retry", config("retry.json"))).rejects.toThrow();
    await seedDatabase("retry", config("retry.json"));
    expect(readFile).toHaveBeenCalledTimes(2);
    expect(seed).toHaveBeenCalledTimes(1);
  });
});
