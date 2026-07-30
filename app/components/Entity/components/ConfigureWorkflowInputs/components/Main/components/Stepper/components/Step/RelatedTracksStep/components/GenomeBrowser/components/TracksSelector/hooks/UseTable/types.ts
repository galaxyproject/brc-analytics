import { UcscTrack } from "@repo/shared/utils/ucsc-tracks-api/types";

export type Track = Omit<UcscTrack, "isComposite"> & {
  groupId: string;
  tracks: Track[];
};
