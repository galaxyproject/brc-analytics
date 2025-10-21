import { WORKFLOW_PARAMETER_VARIABLE } from "../../apis/catalog/brc-analytics-catalog/common/schema-entities";
import { WorkflowParameter } from "../../apis/catalog/brc-analytics-catalog/common/entities";
import ky from "ky";
import {
  EnaFileInfo,
  EnaSequencingReads,
  GalaxyLandingResponseData,
  WorkflowLandingsBody,
  WorkflowLandingsBodyRequestState,
  WorkflowParameterValue,
  DataLandingsBody,
  DataLandingsBodyRequestState,
  GalaxyPairedCollection,
  GalaxyListCollection,
  GalaxyUrlData,
  GalaxyCollection,
  DataLandingsCollectionTarget,
  DataLandingsCollection,
  DataLandingsDatasetTarget,
  WorkflowCollectionParameter,
  GalaxyCollectionElement,
  WorkflowCollectionElement,
  GalaxyApiCommonUrlData,
} from "./entities";

const DOCKSTORE_API_URL = "https://dockstore.org/api/ga4gh/trs/v2/tools";

const galaxyInstanceUrl = process.env.NEXT_PUBLIC_GALAXY_INSTANCE_URL;

if (!galaxyInstanceUrl) {
  throw new Error("NEXT_PUBLIC_GALAXY_INSTANCE_URL is not set");
}

const workflowLandingsApiUrl = `${galaxyInstanceUrl}/api/workflow_landings`;
const workflowLandingUrl = `${galaxyInstanceUrl}/workflow_landings`;
const dataLandingsApiUrl = `${galaxyInstanceUrl}/api/data_landings`;
const dataLandingUrl = `${galaxyInstanceUrl}/tool_landings`;

/**
 * Get the URL of the workflow landing page for the given genome workflow.
 * @param workflowId - Value for the `workflow_id` parameter sent to the API.
 * @param referenceGenome - Genome version/assembly ID.
 * @param geneModelUrl - URL for gene model parameter sent to the API.
 * @param readRunsSingle - Single read runs parameter sent to the API.
 * @param readRunsPaired - Paired read runs parameter sent to the API.
 * @param parameters - Parameters for this workflow.
 * @returns workflow landing URL.
 */
export async function getWorkflowLandingUrl(
  workflowId: string,
  referenceGenome: string,
  geneModelUrl: string | null,
  readRunsSingle: EnaSequencingReads[] | null,
  readRunsPaired: EnaSequencingReads[] | null,
  parameters: WorkflowParameter[]
): Promise<string> {
  const body: WorkflowLandingsBody = {
    public: true,
    request_state: getWorkflowLandingsRequestState(
      referenceGenome,
      geneModelUrl,
      readRunsSingle,
      readRunsPaired,
      parameters
    ),
    workflow_id: `${DOCKSTORE_API_URL}/${workflowId}`,
    workflow_target_type: "trs_url",
  };
  return getGalaxyLandingUrl(body, workflowLandingsApiUrl, workflowLandingUrl);
}

/**
 * Get the URL of the no-workflow data landing page for the given assembly.
 * @param referenceGenome - Genome version/assembly ID.
 * @param geneModelUrl - URL for gene model parameter sent to the API.
 * @param readRunsSingle - Single read runs parameter sent to the API.
 * @param readRunsPaired - Paired read runs parameter sent to the API.
 * @returns data landing URL.
 */
export async function getDataLandingUrl(
  referenceGenome: string,
  geneModelUrl: string | null,
  readRunsSingle: EnaSequencingReads[] | null,
  readRunsPaired: EnaSequencingReads[] | null
): Promise<string> {
  const body: DataLandingsBody = {
    public: true,
    request_state: getDataLandingsRequestState(
      referenceGenome,
      geneModelUrl,
      readRunsSingle,
      readRunsPaired
    ),
  };
  return getGalaxyLandingUrl(body, dataLandingsApiUrl, dataLandingUrl);
}

async function getGalaxyLandingUrl(
  body: WorkflowLandingsBody | DataLandingsBody,
  apiUrl: string,
  landingUrlBase: string
): Promise<string> {
  const res = await ky.post<GalaxyLandingResponseData>(apiUrl, {
    json: body,
    retry: {
      methods: ["post"],
    },
  });
  const id = (await res.json()).uuid;
  return `${landingUrlBase}/${encodeURIComponent(id)}?public=true`;
}

function galaxyUrlDataToCommonApi(data: GalaxyUrlData): GalaxyApiCommonUrlData {
  return {
    dbkey: data.dbKey,
    ext: data.ext,
    hashes: data.hashes,
    name: data.identifier,
    src: "url",
    url: data.url,
  };
}

function paramVariableToRequestValue(
  variable: WORKFLOW_PARAMETER_VARIABLE,
  geneModelUrl: string | null,
  readRunsSingle: EnaSequencingReads[] | null,
  readRunsPaired: EnaSequencingReads[] | null,
  referenceGenome: string
): WorkflowParameterValue | null {
  // Because this `switch` has no default case, and the function doesn't allow `undefined` as a return type,
  // we ensure through TypeScript that all possible variables are handled.
  switch (variable) {
    case WORKFLOW_PARAMETER_VARIABLE.ASSEMBLY_ID:
      return referenceGenome;
    case WORKFLOW_PARAMETER_VARIABLE.ASSEMBLY_FASTA_URL:
      return galaxyUrlDataToCommonApi(
        buildAssemblyFastaRequestValue(referenceGenome)
      );
    case WORKFLOW_PARAMETER_VARIABLE.GENE_MODEL_URL: {
      const urlData = buildGeneModelUrlRequestValue(
        geneModelUrl,
        referenceGenome
      );
      if (urlData === null) return null;
      return galaxyUrlDataToCommonApi(urlData);
    }
    case WORKFLOW_PARAMETER_VARIABLE.SANGER_READ_RUN_SINGLE:
      return galaxyCollectionToWorkflowParameter(
        buildSingleReadRunsRequestValue(readRunsSingle)
      );
    case WORKFLOW_PARAMETER_VARIABLE.SANGER_READ_RUN_PAIRED: {
      return galaxyCollectionToWorkflowParameter(
        buildPairedReadRunsRequestValue(readRunsPaired)
      );
    }
  }
}

function galaxyCollectionToWorkflowParameter(
  collection: GalaxyCollection | null
): WorkflowCollectionParameter | null {
  if (collection === null) return null;
  return {
    class: "Collection",
    collection_type: collection.collectionType,
    elements: collection.elements.map((elem) =>
      galaxyCollectionElementToWorkflowLandings(elem)
    ),
    name: collection.identifier,
  };
}

function galaxyCollectionElementToWorkflowLandings(
  elem: GalaxyCollectionElement
): WorkflowCollectionElement {
  if ("collectionType" in elem) {
    return {
      class: "Collection",
      collection_type: elem.collectionType,
      elements: elem.elements.map((elem) =>
        galaxyCollectionElementToWorkflowLandings(elem)
      ),
      identifier: elem.identifier,
    };
  } else {
    return {
      class: "File",
      dbkey: elem.dbKey,
      filetype: elem.ext,
      hashes: elem.hashes,
      identifier: elem.identifier,
      location: elem.url,
    };
  }
}

/**
 * Get the appropriate `request_state` object for the given workflow ID and reference genome.
 * @param referenceGenome - Reference genome.
 * @param geneModelUrl - URL for gene model parameter.
 * @param readRunsSingle - Single read runs parameter.
 * @param readRunsPaired - Paired read runs parameter.
 * @param parameters - Parameters for this workflow.
 * @returns `request_state` value for the workflow landings request body.
 */
function getWorkflowLandingsRequestState(
  referenceGenome: string,
  geneModelUrl: string | null,
  readRunsSingle: EnaSequencingReads[] | null,
  readRunsPaired: EnaSequencingReads[] | null,
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
        readRunsSingle,
        readRunsPaired,
        referenceGenome
      );
      if (value !== null) result[key] = value;
    }
  }
  return result;
}

function buildDataLandingsDatasetTarget(
  sourceElements: (GalaxyUrlData | null)[]
): DataLandingsDatasetTarget | null {
  const elements = sourceElements
    .filter((elem) => elem !== null)
    .map((elem) => galaxyUrlDataToCommonApi(elem));
  if (elements.length === 0) return null;
  return {
    destination: { type: "hdas" },
    elements,
  };
}

function galaxyCollectionToDataLandingsTarget(
  collection: GalaxyCollection | null
): DataLandingsCollectionTarget | null {
  if (collection === null) return null;
  return {
    destination: { type: "hdca" },
    ...galaxyCollectionToDataLandings(collection),
  };
}

function galaxyCollectionToDataLandings(
  collection: GalaxyCollection
): DataLandingsCollection {
  return {
    collection_type: collection.collectionType,
    elements: collection.elements.map((elem) => {
      if ("collectionType" in elem) {
        return galaxyCollectionToDataLandings(elem);
      } else {
        return galaxyUrlDataToCommonApi(elem);
      }
    }),
    name: collection.identifier,
  };
}

function getDataLandingsRequestState(
  referenceGenome: string,
  geneModelUrl: string | null,
  readRunsSingle: EnaSequencingReads[] | null,
  readRunsPaired: EnaSequencingReads[] | null
): DataLandingsBodyRequestState {
  return {
    targets: [
      buildDataLandingsDatasetTarget([
        buildAssemblyFastaRequestValue(referenceGenome),
      ]),
      buildDataLandingsDatasetTarget([
        buildGeneModelUrlRequestValue(geneModelUrl, referenceGenome),
      ]),
      galaxyCollectionToDataLandingsTarget(
        buildSingleReadRunsRequestValue(readRunsSingle)
      ),
      galaxyCollectionToDataLandingsTarget(
        buildPairedReadRunsRequestValue(readRunsPaired)
      ),
    ].filter((target) => target !== null),
  };
}

function buildAssemblyFastaRequestValue(
  referenceGenome: string
): GalaxyUrlData {
  return {
    dbKey: referenceGenome,
    ext: "fasta.gz",
    url: buildFastaUrl(referenceGenome),
  };
}

function buildGeneModelUrlRequestValue(
  geneModelUrl: string | null,
  referenceGenome: string
): GalaxyUrlData | null {
  return geneModelUrl
    ? {
        dbKey: referenceGenome,
        ext: "gtf.gz",
        url: geneModelUrl,
      }
    : null;
}

function buildSingleReadRunsRequestValue(
  readRunsSingle: EnaSequencingReads[] | null
): GalaxyListCollection | null {
  if (!readRunsSingle?.length) return null;
  return {
    collectionType: "list",
    elements: readRunsSingle.map((runInfo) => {
      const runAccession = runInfo.runAccession;
      const { forward } = getSingleRunUrlsInfo(runInfo.urls, runInfo.md5Hashes);
      return {
        ext: "fastqsanger.gz",
        hashes: [{ hash_function: "MD5", hash_value: forward.md5 }],
        identifier: runAccession,
        url: forward.url,
      };
    }),
  };
}

function buildPairedReadRunsRequestValue(
  readRunsPaired: EnaSequencingReads[] | null
): GalaxyPairedCollection | null {
  if (!readRunsPaired?.length) return null;
  return {
    collectionType: "list:paired",
    elements: readRunsPaired.map((pairInfo) => {
      const runAccession = pairInfo.runAccession;
      const { forward, reverse } = getPairedRunUrlsInfo(
        pairInfo.urls,
        pairInfo.md5Hashes
      );
      return {
        collectionType: "paired",
        elements: [
          {
            ext: "fastqsanger.gz",
            hashes: [{ hash_function: "MD5", hash_value: forward.md5 }],
            identifier: "forward",
            url: forward.url,
          },
          {
            ext: "fastqsanger.gz",
            hashes: [{ hash_function: "MD5", hash_value: reverse.md5 }],
            identifier: "reverse",
            url: reverse.url,
          },
        ],
        identifier: runAccession,
      };
    }),
  };
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
 * Get forward read URL and run accession for the given single run URLs from ENA.
 * @param enaUrls - Concatenated single run URLs, as provided by ENA.
 * @param enaMd5Hashes - Concatenated MD5 hashes of the files referenced by the URLs, as provided by ENA.
 * @returns forward read URL and run accession.
 */
function getSingleRunUrlsInfo(
  enaUrls: string,
  enaMd5Hashes: string
): {
  forward: EnaFileInfo;
} {
  const { forward } = getRunUrlsInfo(enaUrls, enaMd5Hashes);
  return { forward };
}

/**
 * Get forward and reverse read URLs and run accession for the given paired run URLs from ENA.
 * @param enaUrls - Concatenated paired run URLs, as provided by ENA.
 * @param enaMd5Hashes - Concatenated MD5 hashes of the files referenced by the URLs, as provided by ENA.
 * @returns forward and reverse read URLs and run accession.
 */
function getPairedRunUrlsInfo(
  enaUrls: string,
  enaMd5Hashes: string
): {
  forward: EnaFileInfo;
  reverse: EnaFileInfo;
} {
  const { forward, reverse } = getRunUrlsInfo(enaUrls, enaMd5Hashes);
  if (!reverse) throw new Error("No reverse read URL found in paired run URLs");
  return { forward, reverse };
}

/**
 * Get run accession and full URLs for the given run URLs from ENA.
 * @param enaUrls - Concatenated paired run URLs, as provided by ENA.
 * @param enaMd5Hashes - Concatenated MD5 hashes of the files referenced by the URLs, as provided by ENA.
 * @returns accession, URLs, and hashes for forward and reverse runs.
 */
function getRunUrlsInfo(
  enaUrls: string,
  enaMd5Hashes: string
): {
  forward: EnaFileInfo;
  reverse: EnaFileInfo | null;
} {
  const splitUrls = enaUrls.split(";");
  const splitMd5Hashes = enaMd5Hashes.split(";");
  if (splitMd5Hashes.length !== splitUrls.length)
    throw new Error("Hash list has different length than URL list");
  if (splitUrls.length === 1) {
    // Single read case
    return {
      forward: { md5: splitMd5Hashes[0], url: `ftp://${splitUrls[0]}` },
      reverse: null,
    };
  }
  let forward: EnaFileInfo | null = null;
  let reverse: EnaFileInfo | null = null;
  for (const [i, url] of splitUrls.entries()) {
    // Regarding file name format, see https://ena-docs.readthedocs.io/en/latest/faq/archive-generated-files.html#generated-fastq-files and https://ena-docs.readthedocs.io/en/latest/submit/general-guide/accessions.html#accession-numbers
    const urlMatch = /\/([EDS]RR\d{6,})_([12])\.fastq\.gz$/.exec(url);
    if (!urlMatch) continue;
    const [, , readIndex] = urlMatch;
    const fileInfo: EnaFileInfo = {
      md5: splitMd5Hashes[i],
      url: `ftp://${url}`,
    };
    if (readIndex === "1") forward = fileInfo;
    else reverse = fileInfo;
  }
  if (forward === null) throw new Error("No URL for forward read found");
  return { forward, reverse };
}
