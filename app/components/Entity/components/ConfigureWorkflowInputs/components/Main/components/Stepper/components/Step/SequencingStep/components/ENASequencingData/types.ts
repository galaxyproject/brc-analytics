import { OnConfigure } from "../../../../../../../../../../../../../views/WorkflowInputsView/hooks/UseConfigureInputs/types";
import { UseENA } from "./hooks/UseENA/types";
import { Table } from "@tanstack/react-table";

export interface ReadRun {
  base_count: number;
  experiment_accession: string;
  fastq_ftp: string;
  fastq_md5: string;
  instrument_model: string;
  instrument_platform: string;
  library_layout: string;
  library_strategy: string;
  read_count: number;
  run_accession: string;
  sample_accession: string;
  scientific_name: string;
  study_accession: string;
  submitted_ftp: string;
  tax_id: number;
}

export interface Props extends UseENA<ReadRun> {
  onConfigure: OnConfigure;
  stepKey: "readRunsSingle" | "readRunsPaired";
  table: Table<ReadRun>;
}
