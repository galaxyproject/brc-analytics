export interface UcscTrackGroup {
  groupId: string | undefined;
  tracks: UcscTrackNode[];
}

export type UcscTrackNode = UcscTrack | UcscTrackComposite;

export interface UcscTrackComposite {
  isComposite: true;
  longLabel: string | undefined;
  shortLabel: string | undefined;
  tracks: UcscTrack[];
  type: string | undefined;
}

export interface UcscTrack {
  bigDataUrl: string | undefined;
  isComposite: false;
  longLabel: string | undefined;
  shortLabel: string | undefined;
  type: string | undefined;
}
