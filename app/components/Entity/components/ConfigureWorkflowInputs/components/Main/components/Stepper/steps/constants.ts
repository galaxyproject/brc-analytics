import { StepConfig } from "../components/Step/types";
import { STEP as REFERENCE_ASSEMBLY_STEP } from "../components/Step/ReferenceAssemblyStep/step";
import { STEP as GTF_STEP } from "../components/Step/GTFStep/step";
import {
  ANY_END_STEP,
  PAIRED_END_STEP,
  SINGLE_END_STEP,
} from "../components/Step/SequencingStep/step";
import { WORKFLOW_PARAMETER_VARIABLE } from "../../../../../../../../../apis/catalog/brc-analytics-catalog/common/schema-entities";
import { RELATED_TRACKS_STEP } from "../components/Step/RelatedTracksStep/step";
import { STEP as SAMPLE_SHEET_STEP } from "../components/Step/SampleSheetStep/step";
import { STEP as SAMPLE_SHEET_CLASSIFICATION_STEP } from "../components/Step/SampleSheetClassificationStep/step";
import { STEP as DESEQ2_FORMULA_STEP } from "../components/Step/DESeq2FormulaStep/step";

export const SEQUENCING_STEPS: Record<string, StepConfig> = {
  readRunsPaired: PAIRED_END_STEP,
  readRunsSingle: SINGLE_END_STEP,
};

export const STEP: Record<
  | WORKFLOW_PARAMETER_VARIABLE
  | "DESEQ2_FORMULA"
  | "READ_RUN_ANY"
  | "RELATED_TRACKS"
  | "SAMPLE_SHEET"
  | "SAMPLE_SHEET_CLASSIFICATION",
  StepConfig | null
> = {
  [WORKFLOW_PARAMETER_VARIABLE.ASSEMBLY_FASTA_URL]: null,
  [WORKFLOW_PARAMETER_VARIABLE.ASSEMBLY_ID]: REFERENCE_ASSEMBLY_STEP,
  [WORKFLOW_PARAMETER_VARIABLE.GENE_MODEL_URL]: GTF_STEP,
  [WORKFLOW_PARAMETER_VARIABLE.SANGER_READ_RUN_SINGLE]: SINGLE_END_STEP,
  [WORKFLOW_PARAMETER_VARIABLE.SANGER_READ_RUN_PAIRED]: PAIRED_END_STEP,
  DESEQ2_FORMULA: DESEQ2_FORMULA_STEP,
  READ_RUN_ANY: ANY_END_STEP,
  RELATED_TRACKS: RELATED_TRACKS_STEP,
  SAMPLE_SHEET: SAMPLE_SHEET_STEP,
  SAMPLE_SHEET_CLASSIFICATION: SAMPLE_SHEET_CLASSIFICATION_STEP,
};
