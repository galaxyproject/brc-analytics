import { CategoryConfig } from "@databiosphere/findable-ui/lib/common/categories/config/types";
import { VIEW_KIND } from "@databiosphere/findable-ui/lib/common/categories/views/types";

export const CATEGORY_CONFIGS: Record<string, CategoryConfig> = {
  BASE_COUNT: {
    key: "base_count",
    label: "Base Count",
    viewKind: VIEW_KIND.RANGE,
  },
  EXPERIMENT_ACCESSION: {
    key: "experiment_accession",
    label: "Experiment Accession",
  },
  FASTQ_FTP: { key: "fastq_ftp", label: "Fastq FTP" },
  FIRST_CREATED: { key: "first_created", label: "First Created" },
  INSTRUMENT_MODEL: { key: "instrument_model", label: "Instrument Model" },
  INSTRUMENT_PLATFORM: {
    key: "instrument_platform",
    label: "Instrument Platform",
  },
  LIBRARY_LAYOUT: { key: "library_layout", label: "Library Layout" },
  LIBRARY_STRATEGY: { key: "library_strategy", label: "Library Strategy" },
  READ_COUNT: {
    key: "read_count",
    label: "Read Count",
    viewKind: VIEW_KIND.RANGE,
  },
  RUN_ACCESSION: { key: "run_accession", label: "Run Accession" },
  SAMPLE_ACCESSION: { key: "sample_accession", label: "Sample Accession" },
  SCIENTIFIC_NAME: { key: "scientific_name", label: "Scientific Name" },
  STUDY_ACCESSION: { key: "study_accession", label: "Study Accession" },
  VALIDATION: { key: "validation", label: "Validation" },
} as const;
