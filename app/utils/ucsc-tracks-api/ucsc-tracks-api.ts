import { UcscTrack, UcscTrackComposite, UcscTrackNode } from "./entities";
import { UcscApiResponseTrack, ucscApiResponseTrackSchema } from "./schema";

const TRACKS_API_URL = "https://api.genome.ucsc.edu/list/tracks";
const FILES_API_URL = "https://api.genome.ucsc.edu/list/files";
const DOWNLOAD_BASE_URL = "https://hgdownload.soe.ucsc.edu/";

/**
 * Get tracks for the given assembly from the UCSC API, transformed for use in BRC Analytics.
 * @param assembly - Assembly accession.
 * @returns UCSC tracks.
 */
export async function getAssemblyTracks(
  assembly: string
): Promise<UcscTrackNode[]> {
  // Get object containing tracks from API and MD5 checksums
  const responseData = await getTracksApiResponse(assembly);
  const md5Checksums = await fetchUcscMd5Checksums(assembly);

  const responseTracksContainer = getApiResponseTracksContainer(
    responseData,
    assembly
  );

  // Return transformed tracks

  return (
    await Promise.all(
      Object.values(responseTracksContainer).map(
        async (sourceResponseTrack) => {
          const responseTrack =
            await ucscApiResponseTrackSchema.validate(sourceResponseTrack);
          if (responseTrack.compositeContainer === "TRUE") {
            return await buildTrackComposite(
              responseTrack,
              assembly,
              md5Checksums
            );
          } else {
            return buildTrack(responseTrack, assembly, md5Checksums);
          }
        }
      )
    )
  ).filter((v) => v !== null);
}

/**
 * Fetch MD5 checksums for the given assembly.
 *
 * This function is designed to be fault-tolerant and will not throw errors if checksums
 * cannot be fetched. Checksums are entirely optional and the application will continue
 * to function normally without them. If checksums are unavailable (due to network issues,
 * timeouts, or missing files), an empty Map will be returned.
 *
 * @param assembly - Assembly accession.
 * @returns Map of filename to MD5 hash, or empty Map if checksums are unavailable.
 */
export async function fetchUcscMd5Checksums(
  assembly: string
): Promise<Map<string, string>> {
  try {
    // Get the md5sum.txt URL from the files API
    const md5Url = await getMd5SumUrl(assembly);
    if (!md5Url) {
      console.warn(`Could not find md5sum.txt for assembly ${assembly}`);
      return new Map();
    }

    // Use the URL from the files API
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

    try {
      const res = await fetch(md5Url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!res.ok) {
        // It is expected that some assemblies might not have md5sum.txt, so we just warn and continue.
        console.warn(
          `Optional MD5 checksums not found for assembly ${assembly} at ${md5Url}: ${res.status} ${res.statusText}`
        );
        return new Map();
      }
      const text = await res.text();
      const checksums = parseMd5File(text);
      console.info(
        `Successfully loaded ${checksums.size} MD5 checksums for assembly ${assembly}`
      );
      return checksums;
    } catch (e) {
      clearTimeout(timeoutId);
      // Network errors or timeouts shouldn't break the application, just warn.
      const errorType = e instanceof Error ? e.name : "Unknown";
      const errorMessage = e instanceof Error ? e.message : String(e);
      console.warn(
        `Could not fetch optional MD5 checksums for assembly ${assembly}: ${errorType} - ${errorMessage}`
      );
      return new Map();
    }
  } catch (e) {
    // If anything fails in the process, return an empty map
    console.warn(
      `Could not fetch optional MD5 checksums for assembly ${assembly}: ${String(e)}`
    );
    return new Map();
  }
}

/**
 * Get the URL for the md5sum.txt file for the given assembly using the files API.
 * @param assembly - Assembly accession.
 * @returns The full URL to md5sum.txt if found, otherwise undefined.
 */
async function getMd5SumUrl(assembly: string): Promise<string | undefined> {
  try {
    // Query the files API for the assembly
    const filesData = await getFilesApiResponse(assembly);
    if (!filesData) return undefined;

    // Check if the response contains urlList (the UCSC API format)
    if (typeof filesData !== "object" || !("urlList" in filesData)) {
      console.warn(
        `Unexpected response format from files API for assembly ${assembly}`
      );
      return undefined;
    }

    // Find the md5sum.txt file
    const files = filesData.urlList as Array<{
      dateTime?: string;
      sizeBytes?: number;
      url: string;
    }>;
    const md5File = files.find(
      (file) =>
        file.url &&
        typeof file.url === "string" &&
        file.url.endsWith("md5sum.txt")
    );

    if (!md5File) {
      console.warn(`No md5sum.txt file found for assembly ${assembly}`);
      return undefined;
    }

    // Return the full URL
    return `${DOWNLOAD_BASE_URL}${md5File.url}`;
  } catch (e) {
    console.warn(
      `Error finding md5sum.txt URL for assembly ${assembly}: ${String(e)}`
    );
    return undefined;
  }
}

/**
 * Parse the content of an md5sum.txt file.
 * @param text - Content of the file.
 * @returns Map of filename to MD5 hash.
 */
function parseMd5File(text: string): Map<string, string> {
  const map = new Map<string, string>();
  const lines = text.split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    // Format: <md5>  <filename>
    const parts = trimmed.split(/\s+/);
    if (parts.length >= 2) {
      const md5 = parts[0];
      // Join rest of parts to reconstruct filename (handling potential spaces)
      const filename = parts.slice(1).join(" ");
      map.set(filename, md5);
    }
  }
  return map;
}

/**
 * Transform a composite track from the API into an object to be used in BRC Analytics.
 * @param responseTrack - Composite track from the API.
 * @param assembly - Assembly accession.
 * @param md5Checksums - Map of filename to MD5 hash.
 * @returns transformed composite track, or null if the track is missing required properties.
 */
async function buildTrackComposite(
  responseTrack: UcscApiResponseTrack,
  assembly: string,
  md5Checksums: Map<string, string>
): Promise<UcscTrackComposite | null> {
  // Group is expected to exist and is required downstream, so skip the composite track if it for some reason lacks a group.
  const groupId = responseTrack.group;
  if (groupId === undefined) return null;

  // Determine which values in the API track object represent sub-tracks, and add them to `responseSubTracks`
  const responseTrackValues: unknown[] = Object.values(responseTrack);
  const responseSubTracks: UcscApiResponseTrack[] = [];
  for (const value of responseTrackValues) {
    // Assume that if a value is an object with a `parent` property, it's a sub-track
    if (value && typeof value === "object" && Object.hasOwn(value, "parent")) {
      responseSubTracks.push(await ucscApiResponseTrackSchema.validate(value));
    }
  }

  // Transform sub-tracks
  const tracks = responseSubTracks
    .map((rst) => buildTrack(rst, assembly, md5Checksums, groupId))
    .filter((v) => v !== null);

  // Return composite track
  return {
    groupId,
    isComposite: true,
    longLabel: responseTrack.longLabel,
    shortLabel: responseTrack.shortLabel,
    tracks,
    type: responseTrack.type,
  };
}

/**
 * Transform an individual track from the API into an object to be used in BRC Analytics.
 * @param responseTrack - Track from the API.
 * @param assembly - Assembly accession.
 * @param md5Checksums - Map of filename to MD5 hash.
 * @param parentGroupId - Group of the parent track, if any.
 * @returns transformed track, or null if the track is missing required properties.
 */
function buildTrack(
  responseTrack: UcscApiResponseTrack,
  assembly: string,
  md5Checksums: Map<string, string>,
  parentGroupId?: string
): UcscTrack | null {
  const groupId = responseTrack.group ?? parentGroupId;
  if (groupId === undefined || responseTrack.bigDataUrl === undefined)
    return null;

  const bigDataUrl = getFullBigDataUrl(responseTrack.bigDataUrl);
  const md5Hash = getMd5ForTrack(bigDataUrl, assembly, md5Checksums);

  return {
    bigDataUrl,
    groupId,
    isComposite: false,
    longLabel: responseTrack.longLabel,
    md5Hash,
    shortLabel: responseTrack.shortLabel,
    type: responseTrack.type,
  };
}

/**
 * Extract a relative path from a URL based on the assembly ID and retrieve its MD5 checksum.
 * This is a shared utility function used for checksum extraction across the application.
 *
 * The function is designed to be fault-tolerant and will return undefined if:
 * - The checksums map is empty (which happens when checksums couldn't be fetched)
 * - The URL doesn't contain the assembly ID in the expected format
 * - No matching checksum is found for the extracted path
 *
 * This ensures that checksum verification remains optional and won't break functionality
 * when checksums are unavailable.
 *
 * @param url - The URL to extract the relative path from.
 * @param assembly - Assembly accession.
 * @param md5Checksums - Map of filename to MD5 hash.
 * @returns MD5 hash if found, undefined otherwise.
 */
export function getChecksumForPath(
  url: string,
  assembly: string,
  md5Checksums: Map<string, string>
): string | undefined {
  if (md5Checksums.size === 0) return undefined;

  // URL is like https://hgdownload.soe.ucsc.edu/hubs/GCF/900/681/995/GCF_900681995.1/tracks/someTrack.bb
  // We want to extract the part relative to the hub root (which is where md5sum.txt usually is)
  // The hub root ends with the assembly ID.

  // Simple heuristic: split by assembly ID
  const parts = url.split(`${assembly}/`);
  if (parts.length < 2) return undefined;

  // The relative path is everything after the first occurrence of the assembly ID + slash
  const relativePath = parts.slice(1).join(`${assembly}/`);

  // Check direct match
  if (md5Checksums.has(relativePath)) {
    return md5Checksums.get(relativePath);
  }

  // Sometimes md5sum.txt might have ./ prefix
  if (md5Checksums.has(`./${relativePath}`)) {
    return md5Checksums.get(`./${relativePath}`);
  }

  return undefined;
}

/**
 * Get the MD5 hash for a track based on its URL.
 * This function uses the shared getChecksumForPath utility.
 *
 * The checksum is optional and may be undefined if checksums couldn't be fetched
 * or if no matching checksum was found for this track's URL.
 *
 * @param bigDataUrl - Full URL of the track.
 * @param assembly - Assembly accession.
 * @param md5Checksums - Map of filename to MD5 hash.
 * @returns MD5 hash if found, undefined otherwise.
 */
function getMd5ForTrack(
  bigDataUrl: string,
  assembly: string,
  md5Checksums: Map<string, string>
): string | undefined {
  return getChecksumForPath(bigDataUrl, assembly, md5Checksums);
}

/**
 * Get the object in the tracks API response that directly contains the tracks.
 * @param responseData - Root value parsed from the API response.
 * @param assembly - Assembly accession that was requested.
 * @returns object containing tracks.
 */
function getApiResponseTracksContainer(
  responseData: unknown,
  assembly: string
): object {
  // The API response should be an object containing a key equal to the requested accession;
  // the value associated with that key should be an object, which holds the tracks
  if (responseData && typeof responseData === "object") {
    const tracks = getPropertyIfHasOwn(responseData, assembly);
    if (tracks && typeof tracks === "object") {
      return tracks;
    } else {
      throw new Error(
        `Tracks API response does not contain an object under key ${JSON.stringify(assembly)}`
      );
    }
  } else {
    throw new Error("Tracks API response value is not an object");
  }
}

/**
 * Get response data from the track list API for the given assembly.
 * @param assembly - Assembly accession.
 * @returns API response body, parsed as JSON.
 */
async function getTracksApiResponse(assembly: string): Promise<unknown> {
  const res = await fetch(
    `${TRACKS_API_URL}?genome=${encodeURIComponent(assembly)}`
  );

  if (!res.ok)
    throw new Error(
      `Received ${res.status} ${res.statusText} status from tracks API`
    );

  return res.json();
}

/**
 * Get response data from the files API for the given assembly.
 * @param assembly - Assembly accession.
 * @returns API response body, parsed as JSON, or undefined if the request fails.
 */
async function getFilesApiResponse(
  assembly: string
): Promise<unknown | undefined> {
  try {
    const res = await fetch(
      `${FILES_API_URL}?genome=${encodeURIComponent(assembly)}`
    );

    if (!res.ok) {
      console.warn(
        `Files API returned ${res.status} ${res.statusText} for assembly ${assembly}`
      );
      return undefined;
    }

    return res.json();
  } catch (e) {
    console.warn(
      `Error querying files API for assembly ${assembly}: ${String(e)}`
    );
    return undefined;
  }
}

/**
 * Convert a file path from a `bigDataUrl` field to a useable URL.
 * @param bigDataUrl - File path from the tracks API.
 * @returns file URL.
 */
export function getFullBigDataUrl(bigDataUrl: string): string {
  const match = /^\/gbdb\/genark\/(.*)$/.exec(bigDataUrl);
  if (match === null) {
    throw new Error(
      `bigDataUrl not in expected format: ${JSON.stringify(bigDataUrl)}`
    );
  }
  const filePath = match[1];
  return `${DOWNLOAD_BASE_URL}hubs/${filePath}`;
}

/**
 * If the given object has the given key as a direct property (as determined by `Object.hasOwn`), return that property's value.
 * @param obj - Object to get value from.
 * @param key - Key of the property to get value from.
 * @returns property value, or undefined if the property doesn't exist.
 */
function getPropertyIfHasOwn(obj: object, key: string): unknown {
  if (Object.hasOwn(obj, key)) {
    return obj[key as keyof typeof obj];
  }
}
