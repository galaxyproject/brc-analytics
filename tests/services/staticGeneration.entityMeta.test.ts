import type { SiteConfig } from "@databiosphere/findable-ui/lib/config/entities";
import type { PageMeta } from "@repo/shared/meta/types";
import { getEntity } from "@repo/shared/services/staticGeneration/entities/utils";
import { makeEntityStaticProps } from "@repo/shared/services/staticGeneration/entity/staticProps";
import type { GetStaticPropsContext } from "next";

jest.mock("@databiosphere/findable-ui/lib/utils/seedDatabase", () => ({
  seedDatabase: jest.fn(),
}));
jest.mock("@repo/shared/services/staticGeneration/entities/utils", () => ({
  getEntity: jest.fn(),
}));

interface Thing {
  name: string;
}

const FIXED_META: PageMeta = { pageDescription: "Fixed.", pageTitle: "Fixed" };

/**
 * A site config with one static-loading entity type.
 * @returns Site config accessor.
 */
function config(): Pick<SiteConfig, "entities"> {
  return {
    entities: [{ detail: { staticLoad: true }, route: "things" }],
  } as unknown as Pick<SiteConfig, "entities">;
}

/**
 * Builds the page meta from a record.
 * @param thing - Record.
 * @returns Page meta.
 */
function metaFor(thing: Thing): PageMeta {
  return { pageDescription: `About ${thing.name}.`, pageTitle: thing.name };
}

/**
 * Runs the page's getStaticProps with the given meta and loaded record.
 * @param meta - Fixed page meta, or a function that builds it.
 * @param thing - The record the loader returns, if any.
 * @returns The getStaticProps result.
 */
async function run(
  meta: PageMeta | ((thing: Thing) => PageMeta),
  thing: Thing | undefined
): Promise<unknown> {
  jest.mocked(getEntity).mockResolvedValue(thing);
  const context = { params: { entityId: "a" } } as GetStaticPropsContext<{
    entityId: string;
  }>;
  return makeEntityStaticProps<Thing>(config, "things", meta)(context);
}

describe("makeEntityStaticProps page meta", () => {
  test("uses fixed meta as given", async () => {
    expect(await run(FIXED_META, { name: "Thing A" })).toMatchObject({
      props: FIXED_META,
    });
  });

  test("builds the meta from the record", async () => {
    expect(await run(metaFor, { name: "Thing A" })).toMatchObject({
      props: { pageDescription: "About Thing A.", pageTitle: "Thing A" },
    });
  });

  test("gives no meta when there is no record to build it from", async () => {
    expect(await run(metaFor, undefined)).toEqual({
      props: { entityId: "a", entityListType: "things" },
    });
  });
});
