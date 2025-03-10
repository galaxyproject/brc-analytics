import ky from "ky";
import { GALAXY_ENVIRONMENT } from "site-config/common/galaxy";

interface WorkflowLandingsBody {
  public: true;
  request_state: WorkflowLandingsBodyRequestState;
  workflow_id: string;
  workflow_target_type: "trs_url";
}

type WorkflowLandingsBodyRequestState = {
  [key: string]: { [key: string]: string } | string;
};

interface WorkflowLanding {
  uuid: string;
}

const DOCKSTORE_API_URL = "https://dockstore.org/api/ga4gh/trs/v2/tools";

const { galaxyInstanceUrl } = GALAXY_ENVIRONMENT;
const workflowLandingsApiUrl = `${galaxyInstanceUrl}api/workflow_landings`;
const workflowLandingUrl = `${galaxyInstanceUrl}workflow_landings`;

/**
 * Get the URL of the workflow landing page for the given genome workflow.
 * @param workflowId - Value for the `workflow_id` parameter sent to the API.
 * @param referenceGenome - Genome version/assembly ID.
 * @param geneModelUrl - URL for gene model parameter sent to the API.
 * @param parameters - Parameters for this workflow.
 * @returns workflow landing URL.
 */
export async function getWorkflowLandingUrl(
  workflowId: string,
  referenceGenome: string,
  geneModelUrl: string | null,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- True type is something like { [key: string]: string | string[] }, but can't model with linkml
  parameters: any
): Promise<string> {
  const body: WorkflowLandingsBody = {
    public: true,
    request_state: getWorkflowLandingsRequestState(
      referenceGenome,
      geneModelUrl,
      parameters
    ),
    workflow_id: `${DOCKSTORE_API_URL}/${workflowId}`,
    workflow_target_type: "trs_url",
  };
  const res = await ky.post<WorkflowLanding>(workflowLandingsApiUrl, {
    json: body,
    retry: {
      methods: ["post"],
    },
  });
  const id = (await res.json()).uuid;
  return `${workflowLandingUrl}/${encodeURIComponent(id)}?public=true`;
}

function buildFastaUrl(identifier: string): string {
  const baseUrl = "https://hgdownload.soe.ucsc.edu/hubs/";
  const parts = identifier.split("_");
  const formattedPath = `${parts[0]}/${parts[1].slice(0, 3)}/${parts[1].slice(
    3,
    6
  )}/${parts[1].slice(6, 9)}/${identifier}/${identifier}.fa.gz`;
  return `${baseUrl}${formattedPath}`;
}

function paramValueToRequestValue(
  value: string,
  geneModelUrl: string | null,
  referenceGenome: string
): string | { ext: string; src: string; url: string } | undefined {
  if (value === "{{ assembly_id }}") {
    return referenceGenome;
  } else if (value === "{{ assembly_fasta_url }}") {
    return {
      ext: "fasta.gz",
      src: "url",
      url: buildFastaUrl(referenceGenome),
    };
  } else if (value === "{{ gene_model_url }}" && geneModelUrl) {
    return {
      ext: "gtf.gz",
      src: "url",
      url: geneModelUrl,
    };
  }
  return undefined;
}

/**
 * Get the appropriate `request_state` object for the given workflow ID and reference genome.
 * @param referenceGenome - Reference genome.
 * @param geneModelUrl - URL for gene model parameter.
 * @param parameters - Parameters for this workflow.
 * @returns `request_state` value for the workflow landings request body.
 */
function getWorkflowLandingsRequestState(
  referenceGenome: string,
  geneModelUrl: string | null,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- True type is something like { [key: string]: string | string[] }, but can't model with linkml
  parameters: any
): WorkflowLandingsBodyRequestState {
  const result: WorkflowLandingsBodyRequestState = {};
  if (parameters) {
    // this is the true type, but no idea how to model this with linkml
    const paramObject = parameters as { [key: string]: string };
    Object.entries(paramObject).forEach(([key, value]) => {
      const maybeParam = paramValueToRequestValue(
        value,
        geneModelUrl,
        referenceGenome
      );
      if (maybeParam !== undefined) {
        result[key] = maybeParam;
      }
    });
  }
  return result;
}
