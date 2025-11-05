import {
  UcscTrack,
  UcscTrackComposite,
  UcscTrackGroup,
  UcscTrackNode,
} from "./entities";
import { UcscApiResponseTrack, ucscApiResponseTrackSchema } from "./schema";

const TRACKS_API_URL = "https://api.genome.ucsc.edu/list/tracks";

/**
 * Get tracks for the given assembly from the UCSC API, transformed for use in BRC Analytics.
 * @param assembly - Assembly accession.
 * @returns UCSC tracks, organized by group.
 */
export async function getAssemblyTracks(
  assembly: string
): Promise<UcscTrackGroup[]> {
  // Get object containing tracks from API

  const responseData = await getTracksApiResponse(assembly);
  const responseTracksContainer = getApiResponseTracksContainer(
    responseData,
    assembly
  );

  // Aggregate root tracks into groups

  const responseTracksByGroup = new Map<
    string | undefined,
    UcscApiResponseTrack[]
  >();

  for (const value of Object.values(responseTracksContainer)) {
    const responseTrack = await ucscApiResponseTrackSchema.validate(value);
    const group = responseTrack.group;
    let groupTracks = responseTracksByGroup.get(group);
    if (groupTracks === undefined) {
      groupTracks = [];
      responseTracksByGroup.set(group, groupTracks);
    }
    groupTracks.push(responseTrack);
  }

  // Return transformed tracks per-group

  return await Promise.all(
    Array.from(responseTracksByGroup.entries(), ([group, responseTracks]) =>
      buildTrackGroup(group, responseTracks)
    )
  );
}

/**
 * Transform a list of tracks obtained from the API, and create a track group object for the given group ID.
 * @param groupId - Group ID.
 * @param responseTracks - Tracks (individual and composite) from the API.
 * @returns track group.
 */
async function buildTrackGroup(
  groupId: string | undefined,
  responseTracks: UcscApiResponseTrack[]
): Promise<UcscTrackGroup> {
  const tracks: UcscTrackNode[] = [];
  for (const responseTrack of responseTracks) {
    if (responseTrack.compositeContainer === "TRUE") {
      tracks.push(await buildTrackComposite(responseTrack));
    } else {
      tracks.push(buildTrack(responseTrack));
    }
  }
  return {
    groupId,
    tracks,
  };
}

/**
 * Transform a composite track from the API into an object to be used in BRC Analytics.
 * @param responseTrack - Composite track from the API.
 * @returns transformed composite track.
 */
async function buildTrackComposite(
  responseTrack: UcscApiResponseTrack
): Promise<UcscTrackComposite> {
  const tracks: UcscTrack[] = [];
  const responseTrackValues: unknown[] = Object.values(responseTrack);
  // Determine which values in the API track object represent sub-tracks, and transform them
  for (const value of responseTrackValues) {
    // Assumed that if a value is an object with a `parent` property, it's a sub-track
    if (value && typeof value === "object" && Object.hasOwn(value, "parent")) {
      const responseSubTrack = await ucscApiResponseTrackSchema.validate(value);
      tracks.push(buildTrack(responseSubTrack));
    }
  }
  return {
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
 * @returns transformed track.
 */
function buildTrack(responseTrack: UcscApiResponseTrack): UcscTrack {
  return {
    bigDataUrl: responseTrack.bigDataUrl,
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
