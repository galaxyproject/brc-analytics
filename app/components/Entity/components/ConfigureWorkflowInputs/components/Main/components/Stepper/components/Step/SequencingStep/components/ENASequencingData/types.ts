import { OnConfigure } from "../../../../../../../../../../../../../views/WorkflowInputsView/hooks/UseConfigureInputs/types";
import { UseENADataByAccession } from "./hooks/UseENADataByAccession/types";
import { Table } from "@tanstack/react-table";
import { SEQUENCING_DATA_TYPE } from "../../types";
import { UseENADataByTaxonomyId } from "./hooks/UseENADataByTaxonomyId/types";
import { Dispatch, SetStateAction } from "react";
import { ENA_QUERY_METHOD } from "../../types";

export interface BaseReadRun {
  base_count: number;
  description?: string;
  experiment_accession: string;
  fastq_ftp: string;
  fastq_md5: string;
  instrument_model: string;
  instrument_platform: string;
  library_layout: string;
  library_source?: string;
  library_strategy: string;
  read_count: number;
  run_accession: string;
  sample_accession: string;
  scientific_name: string;
  study_accession: string;
  submitted_ftp: string;
  tax_id: number;
}

export interface ReadRun extends BaseReadRun {
  validation: Validation;
}

export interface Validation {
  error: string | undefined;
  isValid: boolean;
}

export interface Props {
  enaAccession: UseENADataByAccession<BaseReadRun>;
  enaTaxonomyId: UseENADataByTaxonomyId<BaseReadRun>;
  onConfigure: OnConfigure;
  setEnaQueryMethod: Dispatch<SetStateAction<ENA_QUERY_METHOD>>;
  stepKey: SEQUENCING_DATA_TYPE;
  table: Table<ReadRun>;
  taxonomicLevelSpecies: string;
}
