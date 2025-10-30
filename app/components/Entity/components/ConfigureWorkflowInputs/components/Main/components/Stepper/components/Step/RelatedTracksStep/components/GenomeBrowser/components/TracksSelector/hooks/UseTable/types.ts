import { UcscTrack } from "../../../../../../../../../../../../../../../../../utils/ucsc-tracks-api/entities";

export type Track = Omit<UcscTrack, "bigDataUrl"> & {
  bigDataUrl: string;
  groupId: string;
};
