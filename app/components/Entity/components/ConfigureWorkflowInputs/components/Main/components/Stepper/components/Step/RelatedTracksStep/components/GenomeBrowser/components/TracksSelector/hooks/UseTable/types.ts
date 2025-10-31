import { UcscTrack } from "../../../../../../../../../../../../../../../../../utils/ucsc-tracks-api/entities";

export type Track = Omit<UcscTrack, "isComposite"> & {
  groupId: string;
  tracks: Track[];
};
