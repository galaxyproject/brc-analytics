import {
  UcscTrackComposite,
  UcscTrackGroup,
  UcscTrackNode,
} from "../../../../../../../../../../../../../../../../../utils/ucsc-tracks-api/entities";
import { Track } from "./types";

/**
 * Filters track groups to only those with a group identifier.
 * @param trackGroup - Track group.
 * @returns Track group with group identifier.
 */
function filterTrackGroup(
  trackGroup: UcscTrackGroup
): trackGroup is UcscTrackGroup & { groupId: string } {
  return !!trackGroup.groupId;
}

/**
 * Maps track groups to tracks (tracks, with group identifier).
 * @param trackGroups - Track groups.
 * @returns Tracks.
 */
export function mapTrackGroups(trackGroups?: UcscTrackGroup[]): Track[] {
  if (!trackGroups) return [];

  return trackGroups
    .filter(filterTrackGroup)
    .reduce((acc: Track[], trackGroup) => {
      const { groupId } = trackGroup;
      // Create the "leaf rows" for the track group.
      const tracks: Track[] = [];
      for (const trackNode of trackGroup.tracks) {
        processTrackNode(trackNode, groupId, tracks);
      }
      acc.push(...tracks);
      return acc;
    }, []);
}

function processTrackNode(
  trackNode: UcscTrackNode,
  groupId: string,
  tracks: Track[]
): void {
  // Destructure shared properties (composite vs non-composite).
  const { longLabel, shortLabel, type } = trackNode;
  // Determine the bigDataUrl value.
  const bigDataUrl = trackNode.isComposite ? undefined : trackNode.bigDataUrl;
  // Create the track object.
  tracks.push({ bigDataUrl, groupId, longLabel, shortLabel, type });
  if (trackNode.isComposite) {
    // Handle composite node tracks (recursively).
    for (const track of trackNode.tracks) {
      processTrackNode(track, groupId, tracks);
    }
  }
}

export function sanitizeTracks(tracks: Track[]): Track[] {
  return tracks.filter((track) => !!track.bigDataUrl);
}
