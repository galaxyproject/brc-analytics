import { UcscTrack } from "@brc-analytics/core/utils/ucsc-tracks-api/entities";

export type Track = Omit<UcscTrack, "isComposite"> & {
  groupId: string;
  tracks: Track[];
};
