import { DOWNLOAD_BASE_URL } from "./constants";

/**
 * Filters the GTF file URLs from the UCSC files API response.
 * @param url - URL.
 * @returns True if the URL lives under the UCSC genes directory and ends with ".gtf.gz".
 */
function filterUrl(url: string): boolean {
  return url.includes("/genes/") && url.endsWith(".gtf.gz");
}

/**
 * Parses the result from the UCSC files API to extract GTF file URLs.
 * @param data - Data.
 * @param data.urlList - List of URL objects.
 * @returns A list of GTF file URLs.
 */
export function select(data: { urlList: { url: string }[] }): string[] {
  return data.urlList
    .flatMap(({ url }) => url)
    .filter(filterUrl)
    .map((url) => `${DOWNLOAD_BASE_URL}/${url}`);
}
