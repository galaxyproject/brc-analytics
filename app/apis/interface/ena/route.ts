import {
  ENAAssembly,
  PrimaryDataApiResult,
} from "app/apis/catalog/brc-analytics-catalog/common/entities";
import { NextResponse } from "next/server";

const assembly_fields = [
  "accession",
  "sra_md5",
  "base_count",
  "study_accession",
  "sample_accession",
  "instrument_platform",
  "instrument_model",
  "library_layout",
  "fastq_ftp",
  "fastq_md5",
];
const ena_url = "https://www.ebi.ac.uk/ena/portal/api/search";
const items_limit = 1000;
const number_of_retries = 3;
const sleep_before_retry = 1000;

/**
 * Helper function
 *
 * Extracts accession IDs from a given filter string, validates their format,
 * and constructs a URL for querying sample IDs based on the extracted accession IDs.
 *
 * @param filter - A string containing accession filters in the format `accession=GCF_XXXXXXX.X` or `accession=GCA_XXXXXXX.X`.
 *
 * @returns An object containing:
 * - `accessions`: An array of extracted accession IDs.
 * - `accessionsDict`: A dictionary mapping each accession ID to an array of its occurrences in the filter string.
 * - `accessionsUrl`: A URL for querying sample IDs based on the extracted accession IDs.
 *
 * @throws An error if any accession ID in the filter string does not match the expected format.
 *
 * @example
 * ```typescript
 * const filter = 'accession=GCF_000001.1 OR accession=GCA_000002.2';
 * const result = getSampleAcceionIds(filter);
 * console.log(result.accessions); // ['GCF_000001.1', 'GCA_000002.2']
 * console.log(result.accessionsDict); // { 'GCF_000001.1': ['accession=GCF_000001.1'], 'GCA_000002.2': ['accession=GCA_000002.2'] }
 * console.log(result.accessionsUrl); // Constructed URL for querying sample IDs
 * ```
 */
function getSampleAcceionIds(filter: string): {
  accessionsDict: { [key: string]: string[] };
  accessionsUrl: string;
} {
  const accessionsDict: { [key: string]: string[] } = {};
  const accessionRegex = /(\baccession\s*=\s*)("?)(GC[FA]_\d+\.\d+)("?)/g;
  let match;
  let counterCounter = 0;
  while ((match = accessionRegex.exec(filter)) !== null) {
    counterCounter++;
    if (accessionsDict[match[3]]) {
      accessionsDict[match[3]].push(
        `${match[1]}${match[2]}${match[3]}${match[4]}`
      );
    } else {
      accessionsDict[match[3]] = [
        `${match[1]}${match[2]}${match[3]}${match[4]}`,
      ];
    }
  }
  if ((filter.match(/(\baccession\s*=)\s*/g)?.length || 0) !== counterCounter) {
    throw new Error(
      `GCF/GCA syntax error, on or multiple accession id have incorrect format, should be GCF_XXXXXXX.X or GCA_XXXXXXX.X`
    );
  }
  if (Object.keys(accessionsDict).length === 0) {
    return {
      accessionsDict: accessionsDict,
      accessionsUrl: "",
    };
  }
  const queryParams = new URLSearchParams({
    query: Object.keys(accessionsDict)
      .map((key) => `assembly_set_accession="${key}"`)
      .join(" OR "),
  });
  // Construct the URL for the API request to fetch sample IDs based on accession IDs
  return {
    accessionsDict: accessionsDict,
    accessionsUrl: `${ena_url}?result=assembly&fields=assembly_set_accession,sample_accession&${queryParams.toString()}&format=json`,
  };
}

/**
 * Helper function
 *
 * Fetches data from the ENA (European Nucleotide Archive) API with support for retries and error handling.
 *
 * @param url - The URL of the ENA API endpoint to fetch data from.
 * @param redirect_arg - The redirect behavior for the fetch request. Defaults to "manual".
 * @returns A promise that resolves to a `PrimaryDataApiResult` object containing the fetched data,
 *          or an error message and status code if the request fails.
 *
 * @throws Will throw an error if the response cannot be parsed as JSON or if unexpected issues occur.
 *
 * @remarks
 * - If the API returns a 301 status, it indicates that the ENA API has been updated, and the function will return an error message.
 * - If the API returns a 427 status, it indicates that the rate limit has been exceeded. The function will retry the request after a delay.
 * - Retries are attempted until the `number_of_retries` is exhausted.
 * - The function handles both JSON-parsable and non-JSON error responses.
 *
 * @example
 * ```typescript
 * const result = await fetchDataFromENA("https://127.0.0.1/api/data");
 * if (result.error) {
 *   console.error(`Error: ${result.error}`);
 * } else {
 *   console.log(`Fetched ${result.count} records.`);
 * }
 * ```
 */
async function fetchDataFromENA(
  url: string,
  redirect_arg: RequestRedirect = "manual"
): Promise<PrimaryDataApiResult> {
  let retries = number_of_retries;
  let response: Response = await fetch(url, { redirect: redirect_arg });
  while (response.status !== 200) {
    retries--;
    if (response.status === 301) {
      console.debug(
        `ENA Rest API has been updated, internal API call needs update: ${url}`
      );
      return {
        count: 0,
        data: [],
        error: `ENA Rest API has been updated!!!`,
        status: 301,
      };
    }
    const errorMessageText = await response.text();
    let errorMessage;
    try {
      errorMessage = JSON.parse(errorMessageText).message;
    } catch (e) {
      errorMessage = `errorMessageText: ${e}`;
    }

    if (response.status === 427) {
      if (retries < 0) {
        console.debug(
          `ENA API rate limit exceeded, waiting for 5 seconds before retrying...`
        );
        setTimeout(
          () =>
            console.debug(
              `ENA API return status ${response.status}! Will sleep for ${sleep_before_retry}. Retry attemps left ${retries}`
            ),
          sleep_before_retry
        );
        response = await fetch(url, { redirect: redirect_arg });
      } else {
        const errorMessageText = await response.text();
        return {
          count: 0,
          data: [],
          error: `from ENA, ${errorMessageText}`,
          status: response.status,
        };
      }
    } else {
      return {
        count: 0,
        data: [],
        error: `from ENA, ${errorMessage}`,
        status: response.status,
      };
    }
  }
  const result = await response.json();
  return Promise.resolve({
    count: "count" in result ? parseInt(result.count) : result.length,
    data: result,
    error: "",
    status: response.status,
  });
}

/**
 * Helper function
 *
 * Updates a filter string by replacing accession expressions with sample accession
 * based on the provided API response and accession mappings.
 *
 * @param filter - The filter string to be updated.
 * @param accessionsDict - A dictionary mapping accession identifiers to their corresponding expressions in the filter string.
 * @param response - The API response containing data about ENA assemblies.
 * @param response.data - An array of ENAAssembly objects containing assembly and sample accession details.
 * @param response.error - A string describing any error that occurred during the API call.
 * @param response.status - The HTTP status code of the API response.
 * @returns The updated filter string with accession expressions replaced by sample accession conditions.
 *
 * @remarks
 * - If an accession is not found in the API response, its corresponding expressions in the filter
 *   are replaced with `sample_accession="NO_SAMPLE"`.
 * - The function assumes that the `response.data` array contains objects of type `ENAAssembly`,
 *   which have `assembly_set_accession` and `sample_accession` properties.
 *
 * @example
 * ```typescript
 * const filter = "accession=GCA_009859065.2";
 * const accessionsDict = { "GCA_009859065.2": ["accession=GCA_009859065.2"] };
 * const response = {
 *   data: [
 *     { assembly_set_accession: 'GCA_009859065.2', sample_accession: 'SAMN09946140', accession: 'GCA_009859065' },
 *     { assembly_set_accession: 'GCA_009859065.2', sample_accession: 'SAMN09946145', accession: 'GCA_009859065' },
 *   ],
 *   error: "",
 *   status: 200
 * };
 * const updatedFilter = updateFilterWithSampleIds(filter, accessionsDict, response);
 * console.log(updatedFilter);
 * // Output: '(sample_accession=SAMN09946140 OR sample_accession=SAMN09946145)'
 * ```
 */
function updateFilterWithSampleIds(
  filter: string,
  accessionsDict: { [key: string]: string[] },
  response: { data: []; error: string; status: number }
): string {
  // Extract sample IDs from the API response and add them to the sample_ids dictionary
  const sample_ids: { [key: string]: string[] } = {};
  for (const assembly of response.data as ENAAssembly[]) {
    if (!sample_ids[assembly.assembly_set_accession]) {
      sample_ids[assembly.assembly_set_accession] = [assembly.sample_accession];
    } else {
      sample_ids[assembly.assembly_set_accession].push(
        assembly.sample_accession
      );
    }
  }
  for (const accession in accessionsDict) {
    if (sample_ids[accession]) {
      for (const accessionExpression of accessionsDict[accession]) {
        filter = filter.replace(
          new RegExp(accessionExpression, "g"),
          "(" +
            sample_ids[accession]
              .map((sample_id) => `sample_accession="${sample_id}"`)
              .join(" OR ") +
            ")"
        );
      }
    } else {
      for (const accessionExpression of accessionsDict[accession]) {
        filter = filter.replace(
          accessionExpression,
          `sample_accession="NO_SAMPLE"`
        );
      }
    }
  }
  return filter;
}

/**
 * Helper function
 *
 * Processes a filter string to identify and translate accession IDs into sample IDs.
 *
 * This function scans the filter string for accession IDs (e.g., GCA_XXXXXXX.X or GCF_XXXXXXX.X),
 * fetches the corresponding sample IDs from the ENA API, and updates the filter string by replacing
 * accession expressions with sample accession conditions.
 *
 * @param filter - The filter string to process.
 * @returns A promise that resolves to the updated filter string with accession IDs replaced by sample IDs.
 *
 * @remarks
 * - If the filter string does not contain any accession IDs, the original filter is returned.
 * - If the ENA API call fails, an error is thrown with details about the failure.
 *
 * @example
 * ```typescript
 * const filter = 'accession=GCA_009859065.2 AND accession=GCF_009859065.2';
 * const updatedFilter = await processAccessionIds(filter);
 * console.log(updatedFilter);
 * // Output: '(sample_accession="SAMN09946140" OR sample_accession="SAMN0994555") OR sample_accession="NO_SAMPLE"'
 * ```
 */
async function processAccessionIds(filter: string): Promise<string> {
  // Check if the filter string contains accession IDs
  if (filter.includes("accession=")) {
    // Extract accession IDs and construct the URL for querying sample IDs
    const { accessionsDict, accessionsUrl } = getSampleAcceionIds(filter);

    // If no accession IDs are found, return the original filter
    if (accessionsUrl === "") {
      return filter;
    }

    // Fetch sample IDs from the ENA API
    const accession_response = await fetchDataFromENA(accessionsUrl);
    if (accession_response.status !== 200) {
      throw new Error(
        `ENA API error: status: ${accession_response.status}, message: ${JSON.stringify(accession_response.data)}`
      );
    }

    // Update the filter string by replacing accession IDs with sample IDs
    return updateFilterWithSampleIds(
      filter,
      accessionsDict,
      accession_response
    );
  }

  // Return the original filter if no accession IDs are found
  return filter;
}

/**
 * main function
 *
 * Handles POST requests to fetch data from the ENA API based on a provided filter.
 *
 * This function allows for accession IDs to be translated into `sample_accession` values
 * and performs the following steps:
 * - Extracts the `filter` parameter from the incoming JSON request body.
 * - Processes the filter string to handle accession IDs and convert them to sample IDs if necessary.
 * - Fetches the count of matching entries from the ENA API.
 * - If the count is less than the `items_limit`, retrieves the matching items from the ENA API.
 *
 * @param request - The incoming HTTP request object.
 * @returns A `NextResponse` object containing the count of matching entries and the fetched data,
 *          or an error message if any step fails.
 */
export async function POST(request: Request): Promise<NextResponse> {
  // Extract the `filter` parameter from the incoming JSON request body
  let { filter } = await request.json();

  try {
    // Process the filter string to handle accession IDs and convert them to sample IDs if necessary
    filter = await processAccessionIds(filter);
  } catch (error) {
    // Return a 500 response if an error occurs during filter processing
    return NextResponse.json(
      { count: 0, data: [], error: `${error}` },
      { status: 500 }
    );
  }

  // Construct the query parameters for the filter
  const runQueryParams = new URLSearchParams({
    query: filter,
  });

  // Encode the filter URL and fix any encoding issues
  const filter_url = `${runQueryParams.toString().replace(/%3D%3D/g, "%3D")}`;

  // Construct the URL to fetch the count of matching entries from the ENA API
  const count_url = `https://www.ebi.ac.uk/ena/portal/api/count?result=read_run&${filter_url}&format=json`;

  // Fetch the count of matching entries
  const count_response = await fetchDataFromENA(count_url);
  if (count_response.status !== 200) {
    // Return an error response if the count API call fails
    return NextResponse.json(
      { count: 0, data: [], error: count_response.error },
      {
        status: count_response.status,
      }
    );
  }

  // Extract the count of matching entries
  const count: number = count_response.count;

  // If no entries are found, return an empty response
  if (count === 0) {
    return NextResponse.json({ count: 0, data: [] }, { status: 200 });
  }

  // If the count exceeds the limit, return an error response
  if (count > items_limit) {
    return NextResponse.json({
      count: 0,
      data: [],
      error: `Too many entries returned: ${count}, please add filters to reduce the number of entries.`,
    });
  }

  // Construct the URL to fetch the actual data from the ENA API
  const url_search = `https://www.ebi.ac.uk/ena/portal/api/search?result=read_run&${filter_url}&fields=${assembly_fields.join(",")}&limit=${items_limit}&format=json`;

  // Fetch the data from the ENA API
  const search_response = await fetchDataFromENA(url_search);
  if (search_response.status !== 200) {
    // Return an error response if the data API call fails
    return NextResponse.json(search_response.data, {
      status: search_response.status,
    });
  }

  // Return the fetched data along with the count
  return NextResponse.json(
    { count: count, data: search_response.data },
    { status: search_response.status }
  );
}
