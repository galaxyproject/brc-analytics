import { InferType, object, string } from "yup";

export const ucscApiResponseTrackSchema = object({
  bigDataUrl: string(),
  compositeContainer: string(),
  group: string(),
  longLabel: string(),
  shortLabel: string(),
  type: string(),
});

export type UcscApiResponseTrack = InferType<typeof ucscApiResponseTrackSchema>;
