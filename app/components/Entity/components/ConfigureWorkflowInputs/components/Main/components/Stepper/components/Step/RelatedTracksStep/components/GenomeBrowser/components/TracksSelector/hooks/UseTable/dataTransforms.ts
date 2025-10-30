import {
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
      const tracks: Track[] = [];
      trackGroup.tracks.forEach((trackNode) => {
        if (trackNode.isComposite) {
          trackNode.tracks.forEach((track) => {
            tracks.push({ ...track, groupId });
          });
        } else {
          tracks.push({ ...trackNode, groupId });
        }
      });
      acc.push(...tracks);
      return acc;
    }, []);
}

export function sanitizeTracks(tracks: Track[]): Track[] {
  return tracks.filter((track) => !!track.bigDataUrl);
}
