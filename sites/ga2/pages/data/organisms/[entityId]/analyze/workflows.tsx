import { replaceParameters } from "@databiosphere/findable-ui/lib/utils/replaceParameters";
import { config } from "@ga2/config/config";
import { GA2_PAGE_META } from "@ga2/meta/constants";
import { EntityDataGate } from "@repo/shared/components/EntityDataGate/entityDataGate";
import { WorkflowGate } from "@repo/shared/components/workflow/WorkflowGate/workflowGate";
import { WorkflowNotFound } from "@repo/shared/components/workflow/WorkflowNotFound/workflowNotFound";
import { ROUTES } from "@repo/shared/routes/constants";
import { makeEntityStaticPaths } from "@repo/shared/services/staticGeneration/entity/staticPaths";
import type {
  EntityPageParams,
  EntityPageProps,
} from "@repo/shared/services/staticGeneration/entity/types";
import { useWorkflowRedirect } from "@repo/shared/views/OrganismWorkflowInputsView/hooks/UseWorkflowRedirect/hook";
import { OrganismWorkflowInputsView } from "@repo/shared/views/OrganismWorkflowInputsView/organismWorkflowInputsView";
import type { GetStaticProps } from "next";
import { type JSX } from "react";

const ENTITY_LIST_TYPE = "organisms";

const Page = ({ entityId }: EntityPageProps<never>): JSX.Element => {
  const trsId = useWorkflowRedirect(entityId);

  if (!trsId) return <></>;

  return (
    <EntityDataGate>
      <WorkflowGate
        fallback={
          <WorkflowNotFound
            entityContext="organism"
            href={replaceParameters(ROUTES.ORGANISM, { entityId })}
          />
        }
        trsId={trsId}
      >
        <OrganismWorkflowInputsView entityId={entityId} trsId={trsId} />
      </WorkflowGate>
    </EntityDataGate>
  );
};

export const getStaticPaths = makeEntityStaticPaths(config, ENTITY_LIST_TYPE);

export const getStaticProps: GetStaticProps<
  EntityPageProps<never>,
  EntityPageParams
> = async ({ params }) => {
  if (!params?.entityId) return { notFound: true };

  return {
    props: {
      entityId: params.entityId,
      entityListType: ENTITY_LIST_TYPE,
      ...GA2_PAGE_META.ANALYZE_WORKFLOWS,
    },
  };
};

export default Page;
