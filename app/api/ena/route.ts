import {
  ENAAssembly,
  PrimaryDataApiResult,
} from "app/apis/catalog/brc-analytics-catalog/common/entities";
import { NextResponse } from "next/server";

const items_limit = 10000;

async function fetchDataFromENA(
  url: string,
  redirect_arg: RequestRedirect = "manual"
): Promise<PrimaryDataApiResult> {
  const response: Response = await fetch(url, { redirect: redirect_arg });
  if (response.status !== 200) {
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
    return {
      count: 0,
      data: [],
      error: `from ENA, ${errorMessage}`,
      status: response.status,
    };
  }
  const result = await response.json();
  return Promise.resolve({
    count: "count" in result ? parseInt(result.count) : result.length,
    data: result,
    error: "",
    status: response.status,
  });
}

async function processAccessionIds(filter: string): Promise<string> {
  // Identify any GCG/GCA accession IDS in the filter string, if they exist
  // we need to translate them into sample IDs
  // Will convert the following string
  // 'accession=GCA_009859065.2 AND accession=GCF_009859065.2'
  // into
  // (sample_accession="SAMN09946140" OR sample_accession="SAMN0994555") OR sample_accession="NO_SAMPLE"
  // GCA_009859065.2 generated 2 sample_accession and GCF_009859065.2 generated 0 sample_accession

  function getSampleAcceionIds(filter: string): {
    accessions: string[];
    accessionsDict: { [key: string]: string[] };
    accessionsUrl: string;
  } {
    const accessions: string[] = [];
    const accessionsDict: { [key: string]: string[] } = {};
    const accessionRegex = /(accession\s*=\s*)("?)(GC[FA]_\d+\.\d+)("?)/g;
    let match;
    let counterCounter = 0;
    while ((match = accessionRegex.exec(filter)) !== null) {
      counterCounter++;
      accessions.push(match[3]);
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

    if (filter.match(/\b(accession\s*=)\s*/g)?.length !== counterCounter) {
      throw new Error(
        `GCF/GCA syntax error, on or multiple accession id have incorrect format, should be GCF_XXXXXXX.X or GCA_XXXXXXX.X`
      );
    }
    if (accessions.length === 0) {
      accessions.push("NO_ACCESSION");
    }
    const queryParams = new URLSearchParams({
      query: accessions
        .map((item) => `assembly_set_accession="${item}"`)
        .join(" OR "),
    });
    // Construct the URL for the API request to fetch sample IDs based on accession IDs
    return {
      accessions: accessions,
      accessionsDict: accessionsDict,
      accessionsUrl: `https://www.ebi.ac.uk/ena/portal/api/search?result=assembly&fields=assembly_set_accession,sample_accession&${queryParams.toString()}&format=json`,
    };
  }

  function updateFilterWithSampleIds(
    filter: string,
    accessions: string[],
    accessionsDict: { [key: string]: string[] },
    response: { data: []; error: string; status: number }
  ): string {
    // Extract sample IDs from the API response and add them to the sample_ids array
    const sample_ids: { [key: string]: string[] } = {};
    for (const assembly of response.data as ENAAssembly[]) {
      if (!sample_ids[assembly.assembly_set_accession]) {
        sample_ids[assembly.assembly_set_accession] = [
          assembly.sample_accession,
        ];
      } else {
        sample_ids[assembly.assembly_set_accession].push(
          assembly.sample_accession
        );
      }
    }
    for (const accession of accessions) {
      if (sample_ids[accession]) {
        for (const accessionExpression of accessionsDict[accession]) {
          filter = filter.replace(
            accessionExpression,
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

  if (filter.includes("accession=")) {
    // Find accessions id and create an url and mappers to
    // convert the accession id to sample id
    const { accessions, accessionsDict, accessionsUrl } =
      getSampleAcceionIds(filter);

    // if (accessions.length === 1 && accessions[0] === "NO_ACCESSION") {
    //   throw new Error(
    //     `GCF/GCA syntax error, on or multiple accession id have incorrect format, should be GCF_XXXXXXX.X or GCA_XXXXXXX.X`
    //   );
    // }

    // Fetch the data from the API
    const accession_response = await fetchDataFromENA(accessionsUrl);
    if (accession_response.status !== 200) {
      throw new Error(
        `ENA API error: status: ${accession_response.status}, message: ${JSON.stringify(accession_response.data)}`
      );
    }

    // Update the filter string with the sample IDs
    return updateFilterWithSampleIds(
      filter,
      accessions,
      accessionsDict,
      accession_response
    );
  }
  return filter;
}

export async function POST(request: Request): Promise<NextResponse> {
  let { filter } = await request.json();
  const fields = [
    "accession",
    "sra_md5",
    "base_count",
    "study_accession",
    "sample_accession",
    "instrument_platform",
    "instrument_model",
    "library_layout",
  ];
  try {
    filter = await processAccessionIds(filter);
  } catch (error) {
    return NextResponse.json(
      { count: 0, data: [], error: `${error}` },
      { status: 500 }
    );
  }

  const runQueryParams = new URLSearchParams({
    query: filter,
  });

  const filter_url = `${runQueryParams.toString().replace(/%3D%3D/g, "%3D")}`;
  const count_url = `https://www.ebi.ac.uk/ena/portal/api/count?result=read_run&${filter_url}&format=json`;

  const count_response = await fetchDataFromENA(count_url);
  if (count_response.status !== 200) {
    return NextResponse.json(
      { count: 0, data: [], error: count_response.error },
      {
        status: count_response.status,
      }
    );
  }

  const count: number = count_response.count;
  if (count === 0) {
    return NextResponse.json({ count: 0, data: [] }, { status: 200 });
  }
  if (count > items_limit) {
    return NextResponse.json({
      count: 0,
      data: [],
      error: `To many entries return: ${count}, please add filters to reduce the number of entries.`,
    });
  }

  const url_search = `https://www.ebi.ac.uk/ena/portal/api/search?result=read_run&${filter_url}&fields=${fields.join(",")}&limit=${items_limit}&format=json`;
  //console.debug(`Search URL: ${url_search}`);
  const search_response = await fetchDataFromENA(url_search);
  if (search_response.status !== 200) {
    return NextResponse.json(search_response.data, {
      status: search_response.status,
    });
  }

  return NextResponse.json(
    { count: count, data: search_response.data },
    { status: search_response.status }
  );
}
