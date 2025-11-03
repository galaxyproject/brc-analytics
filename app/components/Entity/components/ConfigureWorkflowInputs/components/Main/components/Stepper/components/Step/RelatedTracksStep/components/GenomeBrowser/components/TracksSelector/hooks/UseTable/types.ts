import { UcscTrack } from "../../../../../../../../../../../../../../../../../utils/ucsc-tracks-api/entities";

export type Track = Omit<UcscTrack, "isComposite" | "longLabel"> & {
  groupId: string;
  longLabel: string;
  tracks: Track[];
};
