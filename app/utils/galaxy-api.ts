import ky from "ky";
import { WORKFLOW_ID } from "../apis/catalog/brc-analytics-catalog/common/entities";

interface WorkflowLandingsBody {
  public: true;
  request_state: WorkflowLandingsBodyRequestState;
  workflow_id: string;
  workflow_target_type: "trs_url";
}

type WorkflowLandingsBodyRequestState = { reference_genome: string };

interface WorkflowLanding {
  uuid: string;
}

const WORKFLOW_LANDINGS_API_URL =
  "https://test.galaxyproject.org/api/workflow_landings";

const WORKFLOW_LANDING_URL_PREFIX =
  "https://test.galaxyproject.org/workflow_landings/";

/**
 * Get the URL of the workflow landing page for the given genome workflow.
 * @param workflowId - Value for the `workflow_id` parameter sent to the API.
 * @param referenceGenome - Genome version/assembly ID.
 * @returns workflow landing URL.
 */
export async function getWorkflowLandingUrl(
  workflowId: WORKFLOW_ID,
  referenceGenome: string
): Promise<string> {
  const body: WorkflowLandingsBody = {
    public: true,
    request_state: getWorkflowLandingsRequestState(workflowId, referenceGenome),
    workflow_id: workflowId,
    workflow_target_type: "trs_url",
  };
  const res = await ky.post<WorkflowLanding>(WORKFLOW_LANDINGS_API_URL, {
    json: body,
    retry: {
      methods: ["post"],
    },
  });
  const id = (await res.json()).uuid;
  return `${WORKFLOW_LANDING_URL_PREFIX}${encodeURIComponent(id)}?public=true`;
}

/**
 * Get the appropriate `request_state` object for the given workflow ID and reference genome.
 * @param workflowId - Workflow ID.
 * @param referenceGenome - Reference genome.
 * @returns `request_state` value for the workflow landings request body.
 */
function getWorkflowLandingsRequestState(
  workflowId: WORKFLOW_ID,
  referenceGenome: string
): WorkflowLandingsBodyRequestState {
  return { reference_genome: referenceGenome };
}
