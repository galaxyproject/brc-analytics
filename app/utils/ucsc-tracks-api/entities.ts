export interface UcscTrackGroup {
  composites: UcscTrackComposite[];
  id: string | undefined;
  tracks: UcscTrack[];
}

export interface UcscTrackComposite {
  longLabel: string | undefined;
  shortLabel: string | undefined;
  tracks: UcscTrack[];
  type: string | undefined;
}

export interface UcscTrack {
  bigDataUrl: string | undefined;
  longLabel: string | undefined;
  shortLabel: string | undefined;
  type: string | undefined;
}
