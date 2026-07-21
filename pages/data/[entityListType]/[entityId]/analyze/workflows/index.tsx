import { getPageMeta } from "@/common/meta/utils";
import { EntityDataGate } from "@/components/EntityDataGate/entityDataGate";
import { config } from "@/config/config";
import { getEntities } from "@/utils/entityUtils";
import { seedDatabase } from "@/utils/seedDatabase";
import { AnalyzeWorkflowsView } from "@/views/AnalyzeWorkflowsView/analyzeWorkflowsView";
import { OrganismWorkflowInputsView } from "@/views/OrganismWorkflowInputsView/organismWorkflowInputsView";
import { WorkflowInputsView } from "@/views/WorkflowInputsView/workflowInputsView";
import { replaceParameters } from "@databiosphere/findable-ui/lib/utils/replaceParameters";
import { ROUTES } from "@repo/shared/routes/constants";
import type {
  GetStaticPaths,
  GetStaticPathsResult,
  GetStaticProps,
  GetStaticPropsContext,
} from "next";
import { useRouter } from "next/router";
import type { ParsedUrlQuery } from "querystring";
import { JSX, useEffect } from "react";

const ENTITY_LIST_TYPE_ORGANISMS = "organisms";

interface Params extends ParsedUrlQuery {
  entityId: string;
  entityListType: string;
}

export interface Props {
  entityId: string;
  entityListType: string;
  pageDescription?: string;
  pageTitle?: string;
}

export const getStaticPaths: GetStaticPaths<Params> = async () => {
  const paths: GetStaticPathsResult<Params>["paths"] = [];

  for (const entityConfig of config().entities) {
    const { route: entityListType } = entityConfig;

    // Statically generate a single base path per assembly and per organism; the
    // selected workflow is carried at runtime as a `trsId` query param.
    if (
      entityListType !== "assemblies" &&
      entityListType !== ENTITY_LIST_TYPE_ORGANISMS
    )
      continue;

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
  const { entityId, entityListType } = params as Params;

  if (!entityId || !entityListType) return { notFound: true };

  const pageMeta = getPageMeta(config().appKey).ANALYZE_WORKFLOWS;

  return {
    props: {
      entityId,
      entityListType,
      ...pageMeta,
    },
  };
};

/**
 * Analyze workflows page. Renders the compatible-workflows list for an assembly,
 * or — when a workflow is selected via the `trsId` query param — the configure
 * inputs view for that workflow. A bare organism URL (no `trsId`) redirects to
 * the organism detail page, where organism workflows are listed.
 * @param props - Page props.
 * @param props.entityId - Entity ID.
 * @param props.entityListType - Entity list type.
 * @returns Analyze workflows page component.
 */
const Page = ({ entityId, entityListType }: Props): JSX.Element => {
  const router = useRouter();
  const trsId =
    typeof router.query.trsId === "string" ? router.query.trsId : undefined;
  const isOrganism = entityListType === ENTITY_LIST_TYPE_ORGANISMS;

  useEffect(() => {
    if (router.isReady && isOrganism && !trsId) {
      router.replace(replaceParameters(ROUTES.ORGANISM, { entityId }));
    }
  }, [router, isOrganism, trsId, entityId]);

  if (!router.isReady || (isOrganism && !trsId)) return <></>;

  let content: JSX.Element;
  if (!trsId) {
    content = <AnalyzeWorkflowsView entityId={entityId} />;
  } else if (isOrganism) {
    content = <OrganismWorkflowInputsView entityId={entityId} trsId={trsId} />;
  } else {
    content = <WorkflowInputsView entityId={entityId} trsId={trsId} />;
  }

  return <EntityDataGate>{content}</EntityDataGate>;
};

export default Page;
