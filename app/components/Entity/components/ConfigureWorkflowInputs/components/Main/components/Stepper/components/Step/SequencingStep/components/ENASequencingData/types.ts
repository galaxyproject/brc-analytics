import {
  ConfiguredInput,
  OnConfigure,
} from "../../../../../../../../../../../../../views/WorkflowInputsView/hooks/UseConfigureInputs/types";
import { Actions, Status } from "./hooks/UseENADataByAccession/types";
import { Table } from "@tanstack/react-table";
import { UseENADataByTaxonomyId } from "./hooks/UseENADataByTaxonomyId/types";

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
  tax_id: string;
}

export interface ReadRun extends BaseReadRun {
  validation: Validation;
}

export interface Validation {
  error: string | undefined;
  isValid: boolean;
}

export interface Props {
  configuredInput: ConfiguredInput;
  enaAccessionActions: Actions<BaseReadRun>;
  enaAccessionStatus: Status;
  enaTaxonomyId: UseENADataByTaxonomyId<BaseReadRun>;
  onConfigure: OnConfigure;
  requirementsMatches: string[];
  selectedCount: number;
  switchBrowseMethod: (data?: BaseReadRun[]) => void;
  table: Table<ReadRun>;
  taxonomicLevelSpecies: string;
  taxonomyMatches: number;
}
