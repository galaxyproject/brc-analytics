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
  DeSeq2WorkflowLandingsBody,
  DeSeq2ColumnDefinition,
  DeSeq2PairedSample,
  DeSeq2SampleSheetCollection,
} from "./entities";
import { COLUMN_TYPE } from "../../components/Entity/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/SampleSheetClassificationStep/types";
import { UcscTrack } from "../ucsc-tracks-api/entities";
import {
  fetchUcscMd5Checksums,
  getChecksumForPath,
} from "../ucsc-tracks-api/ucsc-tracks-api";
import { ftpToAscp } from "./url-utils";

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
 * @param origin - Origin URL of the site making the request.
 * @returns workflow landing URL.
 */
export async function getWorkflowLandingUrl(
  workflowId: string,
  referenceGenome: string,
  geneModelUrl: string | null,
  readRunsSingle: EnaSequencingReads[] | null,
  readRunsPaired: EnaSequencingReads[] | null,
  parameters: WorkflowParameter[],
  origin: string
): Promise<string> {
  const md5Checksums = await fetchUcscMd5Checksums(referenceGenome);
  const body: WorkflowLandingsBody = {
    origin,
    public: true,
    request_state: getWorkflowLandingsRequestState(
      referenceGenome,
      geneModelUrl,
      readRunsSingle,
      readRunsPaired,
      parameters,
      md5Checksums
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
 * @param tracks - UCSC tracks sent to the API. Should all have defined `bigDataUrl` values.
 * @param origin - Origin URL of the site making the request.
 * @returns data landing URL.
 */
export async function getDataLandingUrl(
  referenceGenome: string,
  geneModelUrl: string | null,
  readRunsSingle: EnaSequencingReads[] | null,
  readRunsPaired: EnaSequencingReads[] | null,
  tracks: UcscTrack[] | null,
  origin: string
): Promise<string> {
  const md5Checksums = await fetchUcscMd5Checksums(referenceGenome);
  const body: DataLandingsBody = {
    origin,
    public: true,
    request_state: getDataLandingsRequestState(
      referenceGenome,
      geneModelUrl,
      readRunsSingle,
      readRunsPaired,
      tracks,
      md5Checksums
    ),
  };
  return getGalaxyLandingUrl(body, dataLandingsApiUrl, dataLandingUrl);
}

async function getGalaxyLandingUrl(
  body: WorkflowLandingsBody | DataLandingsBody | DeSeq2WorkflowLandingsBody,
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
  referenceGenome: string,
  md5Checksums: Map<string, string>
): WorkflowParameterValue | null {
  // Because this `switch` has no default case, and the function doesn't allow `undefined` as a return type,
  // we ensure through TypeScript that all possible variables are handled.
  switch (variable) {
    case WORKFLOW_PARAMETER_VARIABLE.ASSEMBLY_ID:
      return referenceGenome;
    case WORKFLOW_PARAMETER_VARIABLE.ASSEMBLY_FASTA_URL:
      return galaxyUrlDataToCommonApi(
        buildAssemblyFastaRequestValue(referenceGenome, md5Checksums)
      );
    case WORKFLOW_PARAMETER_VARIABLE.GENE_MODEL_URL: {
      const urlData = buildGeneModelUrlRequestValue(
        geneModelUrl,
        referenceGenome,
        md5Checksums
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
 * @param md5Checksums - Map of filename to MD5 hash.
 * @returns `request_state` value for the workflow landings request body.
 */
function getWorkflowLandingsRequestState(
  referenceGenome: string,
  geneModelUrl: string | null,
  readRunsSingle: EnaSequencingReads[] | null,
  readRunsPaired: EnaSequencingReads[] | null,
  parameters: WorkflowParameter[],
  md5Checksums: Map<string, string>
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
        referenceGenome,
        md5Checksums
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
  readRunsPaired: EnaSequencingReads[] | null,
  tracks: UcscTrack[] | null,
  md5Checksums: Map<string, string>
): DataLandingsBodyRequestState {
  return {
    targets: [
      buildDataLandingsDatasetTarget([
        buildAssemblyFastaRequestValue(referenceGenome, md5Checksums),
      ]),
      buildDataLandingsDatasetTarget([
        buildGeneModelUrlRequestValue(
          geneModelUrl,
          referenceGenome,
          md5Checksums
        ),
      ]),
      galaxyCollectionToDataLandingsTarget(
        buildSingleReadRunsRequestValue(readRunsSingle)
      ),
      galaxyCollectionToDataLandingsTarget(
        buildPairedReadRunsRequestValue(readRunsPaired)
      ),
      ...buildUcscTracksRequestValues(tracks).map((d) =>
        buildDataLandingsDatasetTarget([d])
      ),
    ].filter((target) => target !== null),
  };
}

function buildAssemblyFastaRequestValue(
  referenceGenome: string,
  md5Checksums: Map<string, string>
): GalaxyUrlData {
  const url = buildFastaUrl(referenceGenome);
  const hashes = getHashesForUrl(url, referenceGenome, md5Checksums);
  return {
    dbKey: referenceGenome,
    ext: "fasta.gz",
    hashes,
    url,
  };
}

function buildGeneModelUrlRequestValue(
  geneModelUrl: string | null,
  referenceGenome: string,
  md5Checksums: Map<string, string>
): GalaxyUrlData | null {
  if (!geneModelUrl) return null;
  const hashes = getHashesForUrl(geneModelUrl, referenceGenome, md5Checksums);
  return {
    dbKey: referenceGenome,
    ext: "gtf.gz",
    hashes,
    url: geneModelUrl,
  };
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
    identifier: "Single End Reads",
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
    identifier: "Paired End Reads",
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
      forward: { md5: splitMd5Hashes[0], url: ftpToAscp(splitUrls[0]) },
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
      url: ftpToAscp(url),
    };
    if (readIndex === "1") forward = fileInfo;
    else reverse = fileInfo;
  }
  if (forward === null) throw new Error("No URL for forward read found");
  return { forward, reverse };
}

/**
 * Build Galaxy URL data objects for UCSC tracks, including optional MD5 checksums when available.
 *
 * This function handles the optional nature of MD5 checksums by only including them when they
 * are available in the track data. If a track doesn't have an MD5 hash, the hashes field will
 * be undefined in the resulting Galaxy URL data object.
 *
 * @param tracks - UCSC tracks to build request values for.
 * @returns Array of Galaxy URL data objects for the tracks.
 */
function buildUcscTracksRequestValues(
  tracks: UcscTrack[] | null
): GalaxyUrlData[] {
  if (!tracks?.length) return [];
  const values: GalaxyUrlData[] = [];
  for (const track of tracks) {
    values.push({
      ext: getUcscBigDataExt(track.bigDataUrl),
      hashes: track.md5Hash
        ? [{ hash_function: "MD5", hash_value: track.md5Hash }]
        : undefined,
      identifier: track.shortLabel,
      url: track.bigDataUrl,
    });
  }
  return values;
}

function getUcscBigDataExt(bigDataUrl: string): string {
  if (bigDataUrl.endsWith(".bb")) return "bigbed";
  else if (bigDataUrl.endsWith(".bw")) return "bigwig";
  return "auto";
}

//// DESeq2 Landing URL Functions

/**
 * Column types that should be included in the column definitions for Galaxy.
 */
const METADATA_COLUMN_TYPES = new Set<COLUMN_TYPE>([
  COLUMN_TYPE.BIOLOGICAL_FACTOR,
  COLUMN_TYPE.TECHNICAL_BLOCKING_FACTOR,
  COLUMN_TYPE.OTHER_COVARIATE,
  COLUMN_TYPE.QC_ONLY,
]);

/**
 * Map COLUMN_TYPE to Galaxy column type.
 * Currently all metadata columns are strings.
 * @returns Galaxy column type.
 */
function columnTypeToGalaxyType(): "string" | "int" | "float" {
  // For now, all metadata columns are strings
  return "string";
}

/**
 * Build column definitions from sample sheet classification.
 * Only includes metadata columns (BIOLOGICAL_FACTOR, TECHNICAL_BLOCKING_FACTOR, OTHER_COVARIATE, QC_ONLY).
 * @param sampleSheetClassification - Classification of sample sheet columns.
 * @returns Array of column definitions.
 */
function buildColumnDefinitions(
  sampleSheetClassification: Record<string, COLUMN_TYPE | null>
): DeSeq2ColumnDefinition[] {
  const definitions: DeSeq2ColumnDefinition[] = [];
  for (const [columnName, columnType] of Object.entries(
    sampleSheetClassification
  )) {
    if (columnType && METADATA_COLUMN_TYPES.has(columnType)) {
      definitions.push({
        name: columnName,
        optional: columnType === COLUMN_TYPE.QC_ONLY,
        type: columnTypeToGalaxyType(),
      });
    }
  }
  return definitions;
}

/**
 * Find columns with specific classification types.
 * @param sampleSheetClassification - Classification of sample sheet columns.
 * @param columnType - Column type to find.
 * @returns Column name or undefined if not found.
 */
function findColumnByType(
  sampleSheetClassification: Record<string, COLUMN_TYPE | null>,
  columnType: COLUMN_TYPE
): string | undefined {
  return Object.entries(sampleSheetClassification).find(
    ([, type]) => type === columnType
  )?.[0];
}

/**
 * Build paired sample elements from sample sheet.
 * @param sampleSheet - Sample sheet data as array of records.
 * @param sampleSheetClassification - Classification of sample sheet columns.
 * @returns Array of paired sample elements.
 */
function buildSampleElements(
  sampleSheet: Record<string, string>[],
  sampleSheetClassification: Record<string, COLUMN_TYPE | null>
): DeSeq2PairedSample[] {
  const identifierColumn = findColumnByType(
    sampleSheetClassification,
    COLUMN_TYPE.IDENTIFIER
  );
  const forwardColumn = findColumnByType(
    sampleSheetClassification,
    COLUMN_TYPE.FORWARD_FILE_URL
  );
  const reverseColumn = findColumnByType(
    sampleSheetClassification,
    COLUMN_TYPE.REVERSE_FILE_URL
  );
  const forwardMd5Column = findColumnByType(
    sampleSheetClassification,
    COLUMN_TYPE.FORWARD_FILE_MD5
  );
  const reverseMd5Column = findColumnByType(
    sampleSheetClassification,
    COLUMN_TYPE.REVERSE_FILE_MD5
  );

  if (!identifierColumn || !forwardColumn || !reverseColumn) {
    throw new Error(
      "Sample sheet must have IDENTIFIER, FORWARD_FILE_URL, and REVERSE_FILE_URL columns"
    );
  }

  return sampleSheet.map((row) => {
    const identifier = row[identifierColumn];
    const forwardUrl = ftpToAscp(row[forwardColumn]);
    const reverseUrl = ftpToAscp(row[reverseColumn]);
    const forwardMd5 = forwardMd5Column ? row[forwardMd5Column] : undefined;
    const reverseMd5 = reverseMd5Column ? row[reverseMd5Column] : undefined;

    return {
      class: "Collection" as const,
      collection_type: "paired" as const,
      elements: [
        {
          class: "File" as const,
          ext: "fastqsanger.gz",
          hashes: forwardMd5
            ? [{ hash_function: "MD5" as const, hash_value: forwardMd5 }]
            : undefined,
          location: forwardUrl,
          name: "forward" as const,
        },
        {
          class: "File" as const,
          ext: "fastqsanger.gz",
          hashes: reverseMd5
            ? [{ hash_function: "MD5" as const, hash_value: reverseMd5 }]
            : undefined,
          location: reverseUrl,
          name: "reverse" as const,
        },
      ],
      name: identifier,
    };
  });
}

/**
 * Build rows metadata mapping from sample sheet.
 * Maps sample identifier to array of metadata values in column_definitions order.
 * @param sampleSheet - Sample sheet data as array of records.
 * @param sampleSheetClassification - Classification of sample sheet columns.
 * @param columnDefinitions - Column definitions to determine value order.
 * @returns Object mapping sample identifiers to arrays of metadata values.
 */
function buildRows(
  sampleSheet: Record<string, string>[],
  sampleSheetClassification: Record<string, COLUMN_TYPE | null>,
  columnDefinitions: DeSeq2ColumnDefinition[]
): Record<string, (string | number)[]> {
  const identifierColumn = findColumnByType(
    sampleSheetClassification,
    COLUMN_TYPE.IDENTIFIER
  );

  if (!identifierColumn) {
    throw new Error("Sample sheet must have IDENTIFIER column");
  }

  const rows: Record<string, (string | number)[]> = {};

  for (const row of sampleSheet) {
    const identifier = row[identifierColumn];
    const values: (string | number)[] = [];

    for (const colDef of columnDefinitions) {
      const value = row[colDef.name];
      // Parse value based on column type
      if (colDef.type === "int") {
        values.push(parseInt(value, 10) || 0);
      } else if (colDef.type === "float") {
        values.push(parseFloat(value) || 0);
      } else {
        values.push(value ?? "");
      }
    }

    rows[identifier] = values;
  }

  return rows;
}

/**
 * Build the sample sheet collection for DESeq2 workflow.
 * @param sampleSheet - Sample sheet data as array of records.
 * @param sampleSheetClassification - Classification of sample sheet columns.
 * @returns Sample sheet collection object.
 */
function buildSampleSheetCollection(
  sampleSheet: Record<string, string>[],
  sampleSheetClassification: Record<string, COLUMN_TYPE | null>
): DeSeq2SampleSheetCollection {
  const columnDefinitions = buildColumnDefinitions(sampleSheetClassification);
  const elements = buildSampleElements(sampleSheet, sampleSheetClassification);
  const rows = buildRows(
    sampleSheet,
    sampleSheetClassification,
    columnDefinitions
  );

  return {
    class: "Collection",
    collection_type: "sample_sheet:paired",
    column_definitions: columnDefinitions,
    elements,
    name: "Sample Sheet",
    rows,
  };
}

/**
 * Get the URL of the DESeq2 workflow landing page.
 * @param workflowId - Galaxy stored workflow ID.
 * @param referenceAssembly - Genome version/assembly ID.
 * @param geneModelUrl - URL for gene model (GTF) file.
 * @param sampleSheet - Sample sheet data as array of records.
 * @param sampleSheetClassification - Classification of sample sheet columns.
 * @param designFormula - DESeq2 design formula.
 * @param origin - Origin URL of the site making the request.
 * @returns DESeq2 workflow landing URL.
 */
export async function getDeSeq2LandingUrl(
  workflowId: string,
  referenceAssembly: string,
  geneModelUrl: string,
  sampleSheet: Record<string, string>[],
  sampleSheetClassification: Record<string, COLUMN_TYPE | null>,
  designFormula: string,
  origin: string
): Promise<string> {
  const sampleSheetCollection = buildSampleSheetCollection(
    sampleSheet,
    sampleSheetClassification
  );

  const body: DeSeq2WorkflowLandingsBody = {
    origin,
    public: true,
    /* eslint-disable sort-keys -- key order matches DeSeq2RequestState interface */
    request_state: {
      "DESeq2 Design Formula": designFormula,
      "Generate additional QC reports": true,
      "GTF File of annotation": {
        class: "File",
        ext: "gtf.gz",
        url: geneModelUrl,
      },
      "Reference genome": referenceAssembly,
      "Sample sheet of sequencing reads": sampleSheetCollection,
      "Use featurecounts for generating count tables": true,
    },
    /* eslint-enable sort-keys -- re-enable sort-keys rule */
    workflow_id: workflowId,
    workflow_target_type: "stored_workflow",
  };

  return getGalaxyLandingUrl(body, workflowLandingsApiUrl, workflowLandingUrl);
}

/**
 * Convert a checksum to the Galaxy API hash format.
 * Uses the shared getChecksumForPath utility to extract checksums.
 *
 * This function is designed to be fault-tolerant and will return undefined
 * if no checksum is available, ensuring that checksum verification remains optional.
 *
 * @param url - URL to get checksums for.
 * @param assembly - Assembly accession.
 * @param md5Checksums - Map of filename to MD5 hash.
 * @returns Galaxy API formatted hashes or undefined if no checksum is available.
 */
function getHashesForUrl(
  url: string,
  assembly: string,
  md5Checksums: Map<string, string>
): GalaxyUrlData["hashes"] {
  const md5 = getChecksumForPath(url, assembly, md5Checksums);

  if (md5) {
    return [{ hash_function: "MD5", hash_value: md5 }];
  }

  return undefined;
}
