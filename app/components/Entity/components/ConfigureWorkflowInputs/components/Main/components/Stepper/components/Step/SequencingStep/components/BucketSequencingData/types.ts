import { OnConfigure } from "../../../../../../../../../../../../../views/WorkflowInputsView/hooks/UseConfigureInputs/types";
import { UseENADataByAccession } from "./hooks/UseENADataByAccession/types";
import { Table } from "@tanstack/react-table";
import { SEQUENCING_DATA_TYPE } from "../../types";
import { UseENADataByTaxonomyId } from "./hooks/UseENADataByTaxonomyId/types";
import { Dispatch, SetStateAction } from "react";
import { ENA_QUERY_METHOD } from "../../types";

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

export interface Props {
  enaAccession: UseENADataByAccession<ReadRun>;
  enaTaxonomyId: UseENADataByTaxonomyId<ReadRun>;
  onConfigure: OnConfigure;
  setEnaQueryMethod: Dispatch<SetStateAction<ENA_QUERY_METHOD>>;
  stepKey: SEQUENCING_DATA_TYPE;
  table: Table<ReadRun>;
  taxonomicLevelSpecies: string;
}
