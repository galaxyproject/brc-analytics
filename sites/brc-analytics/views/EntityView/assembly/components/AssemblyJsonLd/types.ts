import { type BRCDataCatalogGenome } from "@brc/apis/assembly";

export interface AssemblyJsonLdProps {
  assembly: BRCDataCatalogGenome;
}

export interface SchemaDataCatalog {
  "@type": "DataCatalog";
  name: string;
  url: string;
}

export interface SchemaDataDownload {
  "@type": "DataDownload";
  contentUrl: string;
  encodingFormat: string;
}

/**
 * A schema.org Dataset, as Google Dataset Search reads it.
 */
export interface SchemaDataset {
  "@context": "https://schema.org";
  "@type": "Dataset";
  creator: SchemaOrganization;
  datePublished: string;
  description: string;
  distribution?: SchemaDataDownload[];
  identifier: string;
  includedInDataCatalog: SchemaDataCatalog;
  isAccessibleForFree: boolean;
  keywords?: string[];
  license: string;
  name: string;
  sameAs: string[];
  url: string;
  variableMeasured?: SchemaPropertyValue[];
  version?: string;
}

export interface SchemaOrganization {
  "@type": "Organization";
  name: string;
  url: string;
}

export interface SchemaPropertyValue {
  "@type": "PropertyValue";
  name: string;
  unitText?: string;
  value: number | string;
}

export interface VariableMeasured {
  key: keyof BRCDataCatalogGenome;
  name: string;
  unitText?: string;
}
