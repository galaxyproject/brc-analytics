export interface EnaPairedReads {
  md5Hashes: string;
  runAccession: string;
  urls: string;
}

export interface EnaFileInfo {
  md5: string;
  url: string;
}

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
  | WorkflowUrlParameter
  | WorkflowPairedCollectionParameter;

export interface WorkflowUrlParameter {
  dbkey?: string;
  ext: string;
  src: string;
  url: string;
}

// Narrow type specific to the one kind of collection we use -- might be worth defining a more general collection type if we need other kinds of collections
interface WorkflowPairedCollectionParameter {
  class: "Collection";
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

export interface WorkflowLanding {
  uuid: string;
}
