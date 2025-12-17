import { WorkflowUrlSpec } from "../../apis/catalog/brc-analytics-catalog/common/schema-entities";

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
  origin: string;
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
  | WorkflowUrlSpec
  | GalaxyApiCommonUrlData
  | WorkflowCollectionParameter;

export type WorkflowCollectionElement =
  | WorkflowSubCollection
  | WorkflowCollectionUrlData;

export interface WorkflowCollectionParameter {
  class: "Collection";
  collection_type: string;
  elements: WorkflowCollectionElement[];
  name?: string;
}

export interface WorkflowSubCollection {
  class: "Collection";
  collection_type: string;
  elements: WorkflowCollectionElement[];
  identifier?: string;
}

interface WorkflowCollectionUrlData {
  class: "File";
  dbkey?: string;
  filetype: string;
  hashes?: WorkflowDatasetHash[];
  identifier?: string;
  location: string;
}

//// Data landing types

export interface DataLandingsBody {
  origin: string;
  public: true;
  request_state: DataLandingsBodyRequestState;
}

export interface DataLandingsBodyRequestState {
  targets: DataLandingsTarget[];
}

export type DataLandingsTarget =
  | DataLandingsDatasetTarget
  | DataLandingsCollectionTarget;

export interface DataLandingsCollectionTarget extends DataLandingsCollection {
  destination: { type: "hdca" };
}

export interface DataLandingsDatasetTarget {
  destination: { type: "hdas" };
  elements: GalaxyApiCommonUrlData[];
}

type DataLandingsCollectionElement =
  | DataLandingsCollection
  | GalaxyApiCommonUrlData;

export interface DataLandingsCollection {
  collection_type: string;
  elements: DataLandingsCollectionElement[];
  name?: string;
}

//// Shared API types

export interface GalaxyApiCommonUrlData {
  dbkey?: string;
  ext: string;
  hashes?: WorkflowDatasetHash[];
  name?: string;
  src: "url";
  url: string;
}

interface WorkflowDatasetHash {
  hash_function: "MD5" | "SHA-1" | "SHA-256" | "SHA-512";
  hash_value: string;
}

export interface GalaxyLandingResponseData {
  uuid: string;
}

//// Abstracted Galaxy types

export interface GalaxyListCollection extends GalaxyCollection {
  collectionType: "list";
  elements: Array<GalaxyUrlData & { identifier: string }>;
}

export interface GalaxyPairedCollection extends GalaxyCollection {
  collectionType: "list:paired";
  elements: Array<GalaxyPairedFiles & { identifier: string }>;
}

interface GalaxyPairedFiles extends GalaxyCollection {
  collectionType: "paired";
  elements: [
    GalaxyUrlData & { identifier: "forward" },
    GalaxyUrlData & { identifier: "reverse" },
  ];
}

export type GalaxyCollectionElement = GalaxyCollection | GalaxyUrlData;

export interface GalaxyCollection {
  collectionType: string;
  elements: GalaxyCollectionElement[];
  identifier?: string;
}

export interface GalaxyUrlData {
  dbKey?: string;
  ext: string;
  hashes?: WorkflowDatasetHash[];
  identifier?: string;
  url: string;
}
