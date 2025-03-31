import { Result } from "./types";
import { DOWNLOAD_BASE_URL } from "./constants";

export function parseUCSCFilesResult(response: Result): string[] {
  const { urlList } = response;
  return urlList
    .flatMap(({ url }) => url)
    .filter(filterGFTFile)
    .map((url) => `${DOWNLOAD_BASE_URL}/${url}`);
}

function filterGFTFile(url: string): boolean {
  return url.endsWith(".gtf.gz");
}
