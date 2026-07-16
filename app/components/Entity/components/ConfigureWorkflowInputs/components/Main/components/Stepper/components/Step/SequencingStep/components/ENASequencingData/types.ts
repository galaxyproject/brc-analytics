import { OnConfigure } from "@/views/WorkflowInputsView/hooks/UseConfigureInputs/types";
import {
  Actions,
  Status,
} from "@brc-analytics/core/components/Entity/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/SequencingStep/components/ENASequencingData/hooks/UseENADataByAccession/types";
import { UseQueryResult } from "@tanstack/react-query";
import { Table } from "@tanstack/react-table";

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
  tax_lineage?: string;
}

/**
 * Result of the ENA read-run query hook — the subset of the react-query result
 * the picker consumes. `isLoading` covers both the live count fetch and the
 * read-run download.
 */
export type ENAReadRunsQuery = Pick<
  UseQueryResult<BaseReadRun[]>,
  "data" | "isEnabled" | "isLoading" | "isSuccess"
>;

export interface ReadRun extends BaseReadRun {
  validation: Validation;
}

export interface Validation {
  error: string | undefined;
  isValid: boolean;
}

export interface Props {
  enaAccessionActions: Actions<BaseReadRun>;
  enaAccessionStatus: Status;
  enaTaxonomyId: ENAReadRunsQuery;
  onConfigure: OnConfigure;
  requirementsMatches: string[];
  selectedCount: number;
  switchBrowseMethod: (data?: BaseReadRun[]) => void;
  table: Table<ReadRun>;
  taxonomyMatches: number;
}
