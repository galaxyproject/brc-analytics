//// ENA types

export interface EnaSequencingReads {
  md5Hashes: string;
  runAccession: string;
  urls: string;
}

export interface EnaFileInfo {
  md5: string;
  url: string;
}

//// Workflow landing types

export interface WorkflowLandingsBody {
  public: true;
  request_state: WorkflowLandingsBodyRequestState;
  workflow_id: string;
  workflow_target_type: "trs_url";
}

export type WorkflowLandingsBodyRequestState = {
  [key: string]: WorkflowParameterValue;
};

export type WorkflowParameterValue =
  | string
  | GalaxyUrlData
  | WorkflowCollectionParameter;

export type WorkflowCollectionParameter<
  T extends GalaxyCollection = GalaxyCollection,
> = {
  class: "Collection";
} & T;

//// Data landing types

export interface DataLandingsBody {
  public: true;
  request_state: DataLandingsBodyRequestState;
}

export interface DataLandingsBodyRequestState {
  targets: DataLandingsTarget[];
}

export type DataLandingsTarget =
  | DataLandingsDatasetTarget
  | DataLandingsCollectionTarget;

export interface DataLandingsDatasetTarget {
  destination: { type: "hdas" };
  items: GalaxyUrlData[];
}

export type DataLandingsCollectionTarget<
  T extends GalaxyCollection = GalaxyCollection,
> = {
  destination: { type: "hdca" };
} & T;

//// Shared Galaxy types

export interface GalaxyUrlData {
  dbkey?: string;
  ext: string;
  src: string;
  url: string;
}

// Narrow type specific to the two kinds of collections we use -- might be worth defining a more general collection type if we need other kinds of collections

export type GalaxyCollection = GalaxyListCollection | GalaxyPairedCollection;

export interface GalaxyListCollection {
  collection_type: "list";
  elements: Array<{
    class: "File";
    filetype: string;
    hashes: WorkflowDatasetHash[];
    identifier: string;
    location: string;
  }>;
}

export interface GalaxyPairedCollection {
  collection_type: "list:paired";
  elements: Array<{
    class: "Collection";
    elements: [
      {
        class: "File";
        filetype: string;
        hashes: WorkflowDatasetHash[];
        identifier: "forward";
        location: string;
      },
      {
        class: "File";
        filetype: string;
        hashes: WorkflowDatasetHash[];
        identifier: "reverse";
        location: string;
      },
    ];
    identifier: string;
    type: "paired";
  }>;
}

interface WorkflowDatasetHash {
  hash_function: "MD5" | "SHA-1" | "SHA-256" | "SHA-512";
  hash_value: string;
}

//// Response type

export interface GalaxyLandingResponseData {
  uuid: string;
}
