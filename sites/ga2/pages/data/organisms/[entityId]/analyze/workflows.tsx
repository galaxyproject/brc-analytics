import { replaceParameters } from "@databiosphere/findable-ui/lib/utils/replaceParameters";
import { config } from "@ga2/config/config";
import { GA2_PAGE_META } from "@ga2/meta/constants";
import type { OrganismContract } from "@repo/shared/apis/types";
import { EntityDataGate } from "@repo/shared/components/EntityDataGate/entityDataGate";
import { getOrganismWorkflowAvailability } from "@repo/shared/components/workflow/WorkflowGate/utils";
import { WorkflowGate } from "@repo/shared/components/workflow/WorkflowGate/workflowGate";
import { WorkflowNotFound } from "@repo/shared/components/workflow/WorkflowNotFound/workflowNotFound";
import { ROUTES } from "@repo/shared/routes/constants";
import { makeEntityStaticPaths } from "@repo/shared/services/staticGeneration/entity/staticPaths";
import { makeEntityStaticProps } from "@repo/shared/services/staticGeneration/entity/staticProps";
import type { EntityPageProps } from "@repo/shared/services/staticGeneration/entity/types";
import { slimOrganismGenomes } from "@repo/shared/services/staticGeneration/organism/utils";
import { useWorkflowRedirect } from "@repo/shared/views/OrganismWorkflowInputsView/hooks/UseWorkflowRedirect/hook";
import { OrganismWorkflowInputsView } from "@repo/shared/views/OrganismWorkflowInputsView/organismWorkflowInputsView";
import { type JSX } from "react";

const ENTITY_LIST_TYPE = "organisms";

/**
 * Organism analyze workflows page. A workflow is always selected via the `trsId`
 * query param; a bare URL (no `trsId`) redirects to the organism detail page,
 * where organism workflows are listed. The organism record arrives via props,
 * its genomes cut down to what the workflow check reads; only the workflows
 * list is loaded.
 * @param props - Page props.
 * @param props.data - Organism.
 * @param props.entityId - Organism entity ID.
 * @returns Organism analyze workflows page.
 */
const Page = ({
  data,
  entityId,
}: EntityPageProps<OrganismContract>): JSX.Element => {
  const trsId = useWorkflowRedirect(entityId);

  if (!data || !trsId) return <></>;

  return (
    <EntityDataGate routes={["workflows"]}>
      <WorkflowGate
        fallback={
          <WorkflowNotFound
            entityContext="organism"
            href={replaceParameters(ROUTES.ORGANISM, { entityId })}
          />
        }
        isWorkflowAvailable={getOrganismWorkflowAvailability(data)}
        trsId={trsId}
      >
        <OrganismWorkflowInputsView
          entityId={entityId}
          organism={data}
          trsId={trsId}
        />
      </WorkflowGate>
    </EntityDataGate>
  );
};

export const getStaticPaths = makeEntityStaticPaths(config, ENTITY_LIST_TYPE);

export const getStaticProps = makeEntityStaticProps<OrganismContract>(
  config,
  ENTITY_LIST_TYPE,
  GA2_PAGE_META.ANALYZE_WORKFLOWS,
  slimOrganismGenomes
);

export default Page;
