export type UcscTrackNode = UcscTrack | UcscTrackComposite;

export interface UcscTrackComposite {
  groupId: string;
  isComposite: true;
  longLabel: string | undefined;
  shortLabel: string | undefined;
  tracks: UcscTrack[];
  type: string | undefined;
}

export interface UcscTrack {
  bigDataUrl: string;
  groupId: string;
  isComposite: false;
  longLabel: string | undefined;
  shortLabel: string | undefined;
  type: string | undefined;
}
