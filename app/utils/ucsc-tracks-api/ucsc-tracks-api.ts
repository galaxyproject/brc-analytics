import { UcscTrack, UcscTrackComposite, UcscTrackNode } from "./entities";
import { UcscApiResponseTrack, ucscApiResponseTrackSchema } from "./schema";

const TRACKS_API_URL = "https://api.genome.ucsc.edu/list/tracks";

/**
 * Get tracks for the given assembly from the UCSC API, transformed for use in BRC Analytics.
 * @param assembly - Assembly accession.
 * @returns UCSC tracks.
 */
export async function getAssemblyTracks(
  assembly: string
): Promise<UcscTrackNode[]> {
  // Get object containing tracks from API

  const responseData = await getTracksApiResponse(assembly);
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
            return await buildTrackComposite(responseTrack);
          } else {
            return buildTrack(responseTrack);
          }
        }
      )
    )
  ).filter((v) => v !== null);
}

/**
 * Transform a composite track from the API into an object to be used in BRC Analytics.
 * @param responseTrack - Composite track from the API.
 * @returns transformed composite track, or null if the track is missing required properties.
 */
async function buildTrackComposite(
  responseTrack: UcscApiResponseTrack
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
    .map((rst) => buildTrack(rst, groupId))
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
 * @param parentGroupId - Group of the parent track, if any.
 * @returns transformed track, or null if the track is missing required properties.
 */
function buildTrack(
  responseTrack: UcscApiResponseTrack,
  parentGroupId?: string
): UcscTrack | null {
  const groupId = responseTrack.group ?? parentGroupId;
  if (groupId === undefined || responseTrack.bigDataUrl === undefined)
    return null;
  return {
    bigDataUrl: getFullBigDataUrl(responseTrack.bigDataUrl),
    groupId,
    isComposite: false,
    longLabel: responseTrack.longLabel,
    shortLabel: responseTrack.shortLabel,
    type: responseTrack.type,
  };
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
  return `https://hgdownload.soe.ucsc.edu/hubs/${filePath}`;
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
