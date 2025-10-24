import { UcscTrack, UcscTrackComposite, UcscTrackGroup } from "./entities";
import { UcscApiResponseTrack, ucscApiResponseTrackSchema } from "./schema";

const TRACKS_API_URL = "https://api.genome.ucsc.edu/list/tracks";

export async function getAssemblyTracks(
  assembly: string
): Promise<UcscTrackGroup[]> {
  const responseData = await getTracksApiResponse(assembly);
  const responseTracksContainer = getApiResponseTracksContainer(
    responseData,
    assembly
  );

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

  return await Promise.all(
    Array.from(responseTracksByGroup.entries(), ([group, responseTracks]) =>
      buildTrackGroup(group, responseTracks)
    )
  );
}

async function buildTrackGroup(
  id: string | undefined,
  responseTracks: UcscApiResponseTrack[]
): Promise<UcscTrackGroup> {
  const composites: UcscTrackComposite[] = [];
  const tracks: UcscTrack[] = [];
  for (const responseTrack of responseTracks) {
    if (responseTrack.compositeContainer === "TRUE") {
      composites.push(await buildTrackComposite(responseTrack));
    } else {
      tracks.push(buildTrack(responseTrack));
    }
  }
  return {
    composites,
    id,
    tracks,
  };
}

async function buildTrackComposite(
  responseTrack: UcscApiResponseTrack
): Promise<UcscTrackComposite> {
  const tracks: UcscTrack[] = [];
  const responseTrackValues: unknown[] = Object.values(responseTrack);
  for (const value of responseTrackValues) {
    if (value && typeof value === "object" && Object.hasOwn(value, "parent")) {
      const responseSubTrack = await ucscApiResponseTrackSchema.validate(value);
      tracks.push(buildTrack(responseSubTrack));
    }
  }
  return {
    longLabel: responseTrack.longLabel,
    shortLabel: responseTrack.shortLabel,
    tracks,
    type: responseTrack.type,
  };
}

function buildTrack(responseTrack: UcscApiResponseTrack): UcscTrack {
  return {
    bigDataUrl: responseTrack.bigDataUrl,
    longLabel: responseTrack.longLabel,
    shortLabel: responseTrack.shortLabel,
    type: responseTrack.type,
  };
}

function getApiResponseTracksContainer(
  responseData: unknown,
  assembly: string
): object {
  if (responseData && typeof responseData === "object") {
    const tracks = getPropertyIfHasOwn(responseData, assembly);
    if (tracks && typeof responseData === "object") {
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

function getPropertyIfHasOwn(obj: object, key: string): unknown {
  if (Object.hasOwn(obj, key)) {
    return obj[key as keyof typeof obj];
  }
}
