export const ACCESSION_SEPARATOR_REGEX = /[\s,]+/;

export const ENA_ACCESSION_REGEX_PATTERN: Record<string, RegExp> = {
  experiment_accession: /^(?:[EDS]RX\d{6,})$/i,
  run_accession: /^(?:[EDS]RR\d{6,})$/i,
  sample_accession: /^(?:SAM[EDN][A-Z]?\d+|[EDS]RS\d{6,})$/i,
  study_accession: /^(?:PRJ[EDN][A-Z]\d+|[EDS]RP\d{6,})$/i,
};

export const ENA_FIELDS = [
  "base_count",
  "experiment_accession",
  "fastq_ftp",
  "fastq_md5",
  "fastq_aspera",
  "instrument_model",
  "instrument_platform",
  "library_layout",
  "library_strategy",
  "read_count",
  "run_accession",
  "sample_accession",
  "scientific_name",
  "study_accession",
];
