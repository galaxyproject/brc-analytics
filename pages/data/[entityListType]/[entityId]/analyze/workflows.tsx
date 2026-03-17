import {
  GetStaticPaths,
  GetStaticPathsResult,
  GetStaticProps,
  GetStaticPropsContext,
} from "next";
import { ParsedUrlQuery } from "querystring";
import { JSX } from "react";
import { config } from "../../../../../app/config/config";
import { getEntities } from "../../../../../app/utils/entityUtils";
import { seedDatabase } from "../../../../../app/utils/seedDatabase";

interface Params extends ParsedUrlQuery {
  entityId: string;
  entityListType: string;
}

export interface Props {
  entityId: string;
}

export const getStaticPaths: GetStaticPaths<Params> = async () => {
  const paths: GetStaticPathsResult<Params>["paths"] = [];

  for (const entityConfig of config().entities) {
    const { route: entityListType } = entityConfig;

    // Only statically generate paths for each assembly.
    if (entityListType !== "assemblies") continue;

    await seedDatabase(entityListType, entityConfig);

    const entities = await getEntities(entityConfig);

    for (const entity of entities.hits) {
      const entityId = entityConfig.getId?.(entity);

      if (!entityId) continue;

      paths.push({ params: { entityId, entityListType } });
    }
  }

  return { fallback: false, paths };
};

export const getStaticProps: GetStaticProps<Props> = async ({
  params,
}: GetStaticPropsContext) => {
  const { entityId } = params as Params;

  if (!entityId) return { notFound: true };

  return { props: { entityId } };
};

/**
 * Workflows overview view page.
 * @param props - Page props.
 * @returns Workflows overview view component.
 */
const Page = (props: Props): JSX.Element => {
  return <div>workflows</div>;
};

export default Page;
