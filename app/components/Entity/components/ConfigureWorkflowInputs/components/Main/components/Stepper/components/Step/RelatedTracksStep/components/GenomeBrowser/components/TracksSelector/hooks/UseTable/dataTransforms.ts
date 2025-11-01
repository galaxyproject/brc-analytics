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
 * Maps track groups to hierarchical tracks (parents with children) with group identifier.
 * @param trackGroups - Track groups.
 * @returns Tracks.
 */
export function mapTrackGroups(trackGroups?: UcscTrackGroup[]): Track[] {
  if (!trackGroups) return [];

  return trackGroups
    .filter(filterTrackGroup)
    .reduce((acc: Track[], trackGroup) => {
      const { groupId } = trackGroup;
      const groupTracks: Track[] = [];
      for (const node of trackGroup.tracks) {
        groupTracks.push(mapNodeToTrack(node, groupId));
      }
      acc.push(...groupTracks);
      return acc;
    }, []);
}

function mapNodeToTrack(node: UcscTrackNode, groupId: string): Track {
  const { longLabel, shortLabel, type } = node;
  if ((node as UcscTrackComposite).isComposite) {
    const children: Track[] = node.tracks.map((child) =>
      mapNodeToTrack(child, groupId)
    );
    return {
      bigDataUrl: undefined,
      groupId,
      longLabel,
      shortLabel,
      type,
      tracks: children,
    };
  }
  return {
    bigDataUrl: node.bigDataUrl,
    groupId,
    longLabel,
    shortLabel,
    tracks: [],
    type,
  };
}

export function sanitizeTracks(tracks: Track[]): Track[] {
  return tracks.filter((track) => !!track.bigDataUrl);
}
