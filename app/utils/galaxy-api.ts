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

const WORKFLOW_ID_VARIANT_CALLING =
  "https://dockstore.org/api/ga4gh/trs/v2/tools/#workflow/github.com/iwc-workflows/haploid-variant-calling-wgs-pe/main/versions/v0.1";

const { galaxyInstanceUrl } = GALAXY_ENVIRONMENT;
const workflowLandingsApiUrl = `${galaxyInstanceUrl}api/workflow_landings`;
const workflowLandingUrl = `${galaxyInstanceUrl}workflow_landings`;

/**
 * Get the URL of the workflow landing page for the given genome workflow.
 * @param workflowId - Value for the `workflow_id` parameter sent to the API.
 * @param referenceGenome - Genome version/assembly ID.
 * @param geneModelUrl - URL for gene model parameter sent to the API.
 * @returns workflow landing URL.
 */
export async function getWorkflowLandingUrl(
  workflowId: string,
  referenceGenome: string,
  geneModelUrl: string | null
): Promise<string> {
  const body: WorkflowLandingsBody = {
    public: true,
    request_state: getWorkflowLandingsRequestState(
      workflowId,
      referenceGenome,
      geneModelUrl
    ),
    workflow_id: workflowId,
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

/**
 * Get the appropriate `request_state` object for the given workflow ID and reference genome.
 * @param workflowId - Workflow ID.
 * @param referenceGenome - Reference genome.
 * @param geneModelUrl - URL for gene model parameter.
 * @returns `request_state` value for the workflow landings request body.
 */
function getWorkflowLandingsRequestState(
  workflowId: string,
  referenceGenome: string,
  geneModelUrl: string | null
): WorkflowLandingsBodyRequestState {
  if (workflowId === WORKFLOW_ID_VARIANT_CALLING) {
    const result: WorkflowLandingsBodyRequestState = {
      "Genome fasta": {
        ext: "fasta.gz",
        src: "url",
        url: buildFastaUrl(referenceGenome),
      },
    };
    if (geneModelUrl)
      result["Annotation GTF"] = {
        ext: "gtf.gz",
        src: "url",
        url: geneModelUrl,
      };
    return result;
  }
  return { reference_genome: referenceGenome };
}
