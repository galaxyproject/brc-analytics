import { LABEL } from "@databiosphere/findable-ui/lib/apis/azul/common/entities";
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

/**
 * Maps track nodes to tracks.
 * @param node - Track node.
 * @param groupId - Group identifier.
 * @returns Track.
 */
function mapNodeToTrack(node: UcscTrackNode, groupId: string): Track {
  const { isComposite, longLabel = LABEL.UNSPECIFIED, shortLabel, type } = node;

  // Initialize bigDataUrl and tracks.
  let bigDataUrl: Track["bigDataUrl"] = undefined;
  let tracks: Track[] = [];

  // If the node is a composite, map its tracks to tracks.
  if (isComposite) {
    tracks = node.tracks.map((child) => mapNodeToTrack(child, groupId));
  } else {
    // Otherwise, set the bigDataUrl.
    bigDataUrl = node.bigDataUrl;
  }

  // Return the track.
  return {
    bigDataUrl,
    groupId,
    longLabel,
    shortLabel,
    tracks,
    type,
  };
}
