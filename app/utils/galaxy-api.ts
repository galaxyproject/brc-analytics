import ky from "ky";

interface WorkflowLandingsBody {
  request_state: { reference_genome: string };
  workflow_id: string;
  workflow_target_type: "trs_url";
}

interface WorkflowLanding {
  uuid: string;
}

const WORKFLOW_LANDINGS_URL =
  "https://test.galaxyproject.org/api/workflow_landings";

/**
 * Get the ID of the workflow landing page for the given genome workflow.
 * @param workflowId - Value for the `workflow_id` parameter sent to the API.
 * @param referenceGenome - Genome version/assembly ID.
 * @returns workflow landing UUID.
 */
export async function getWorkflowLandingId(
  workflowId: string,
  referenceGenome: string
): Promise<string> {
  const body: WorkflowLandingsBody = {
    request_state: {
      reference_genome: referenceGenome,
    },
    workflow_id: workflowId,
    workflow_target_type: "trs_url",
  };
  const res = await ky.post<WorkflowLanding>(WORKFLOW_LANDINGS_URL, {
    json: body,
    retry: {
      methods: ["post"],
    },
  });
  return (await res.json()).uuid;
}
