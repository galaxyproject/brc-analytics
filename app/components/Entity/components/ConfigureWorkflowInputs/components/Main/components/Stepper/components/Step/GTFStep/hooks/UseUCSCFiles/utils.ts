import { Result } from "./types";
import { DOWNLOAD_BASE_URL } from "./constants";

/**
 * Parses the result from the UCSC files API to extract GTF file URLs.
 * @param response - Response.
 * @returns A list of GTF file URLs.
 */
export function parseUCSCFilesResult(response: Result): string[] {
  const { urlList } = response;
  return urlList
    .flatMap(({ url }) => url)
    .filter(filterGFTFile)
    .map((url) => `${DOWNLOAD_BASE_URL}/${url}`);
}

/**
 * Filters the GTF file URLs from the UCSC files API response.
 * @param url - URL.
 * @returns True if the URL lives under the UCSC genes directory and ends with ".gtf.gz".
 */
function filterGFTFile(url: string): boolean {
  return url.includes("/genes/") && url.endsWith(".gtf.gz");
}
