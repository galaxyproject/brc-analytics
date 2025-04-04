import { WORKFLOW_PARAMETER_VARIABLE } from "../apis/catalog/brc-analytics-catalog/common/schema-entities";
import {
  WorkflowParameter,
  WorkflowUrlParameter,
} from "../apis/catalog/brc-analytics-catalog/common/entities";
import ky from "ky";
import { GALAXY_ENVIRONMENT } from "site-config/common/galaxy";

interface WorkflowLandingsBody {
  public: true;
  request_state: WorkflowLandingsBodyRequestState;
  workflow_id: string;
  workflow_target_type: "trs_url";
}

type WorkflowLandingsBodyRequestState = {
  [key: string]: string | WorkflowUrlParameter;
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
  parameters: WorkflowParameter[]
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

function paramVariableToRequestValue(
  variable: WORKFLOW_PARAMETER_VARIABLE,
  geneModelUrl: string | null,
  referenceGenome: string
): WorkflowLandingsBodyRequestState[string] | null {
  // Because this `switch` has no default case, and the function doesn't allow `undefined` as a return type,
  // we ensure through TypeScript that all possible variables are handled.
  switch (variable) {
    case WORKFLOW_PARAMETER_VARIABLE.ASSEMBLY_ID:
      return referenceGenome;
    case WORKFLOW_PARAMETER_VARIABLE.ASSEMBLY_FASTA_URL:
      return {
        ext: "fasta.gz",
        src: "url",
        url: buildFastaUrl(referenceGenome),
      };
    case WORKFLOW_PARAMETER_VARIABLE.GENE_MODEL_URL:
      return geneModelUrl
        ? {
            ext: "gtf.gz",
            src: "url",
            url: geneModelUrl,
          }
        : null;
  }
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
  parameters: WorkflowParameter[]
): WorkflowLandingsBodyRequestState {
  const result: WorkflowLandingsBodyRequestState = {};
  for (const { key, url_spec, variable } of parameters) {
    if (url_spec) {
      // If url_spec is provided, use it directly
      result[key] = url_spec;
    } else if (variable) {
      // Otherwise, use the variable to determine the value
      const value = paramVariableToRequestValue(
        variable,
        geneModelUrl,
        referenceGenome
      );
      if (value !== null) result[key] = value;
    }
  }
  return result;
}
