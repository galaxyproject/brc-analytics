// API types for LLM and ENA services

export interface DatasetSearchRequest {
  include_metadata?: boolean;
  max_results: number;
  query: string;
}

export interface DatasetInterpretation {
  assembly_completeness: string | null;
  assembly_level: string | null;
  confidence: number;
  date_range: { end: string; start: string } | null;
  experiment_type: string | null;
  keywords: string[];
  library_source: string | null;
  library_strategy: string | null;
  organism: string | null;
  sequencing_platform: string | null;
  study_type: string | null;
  taxonomy_id: string | null;
}

export interface ENAResult {
  accession: string;
  collection_date?: string;
  description?: string;
  experiment_accession?: string;
  experiment_title?: string;
  first_public?: string;
  instrument_model?: string;
  library_layout?: string;
  library_source?: string;
  library_strategy?: string;
  read_count?: number;
  run_accession?: string;
  sample_accession?: string;
  sample_title?: string;
  scientific_name?: string;
  study_accession?: string;
  study_title?: string;
}

export interface ENAStudyGroup {
  run_count: number;
  runs: ENAResult[];
  study_accession: string;
  study_title: string;
}

export interface DatasetSearchResponse {
  cached: boolean;
  count: number;
  ena_error?: string;
  interpretation: DatasetInterpretation;
  llm_tokens_used?: number;
  metadata?: {
    interpretation_cached: boolean;
    model_used: string;
    search_cached: boolean;
  };
  query: string;
  results: ENAResult[];
  search_method: string;
  status: "success" | "partial" | "invalid_query";
}

export interface WorkflowSuggestionRequest {
  analysis_goal: string;
  data_format?: string;
  dataset_description: string;
  experiment_type?: string;
  organism_taxonomy_id?: string;
}

export interface WorkflowRecommendation {
  compatibility_notes?: string;
  confidence: number;
  parameters?: Record<string, unknown>;
  reasoning: string;
  workflow_id?: string;
  workflow_name: string;
}

export interface WorkflowSuggestionResponse {
  analysis_goal: string;
  count: number;
  dataset_description: string;
  llm_tokens_used?: number;
  model_used?: string;
  recommended_workflows: WorkflowRecommendation[];
  status: string;
}

export interface UnifiedSearchRequest {
  max_results?: number;
  query: string;
}

// Analysis Assistant types

export type FieldStatus = "empty" | "filled" | "needs_attention";

export interface SchemaFieldState {
  detail: string | null;
  status: FieldStatus;
  value: string | null;
}

export interface AnalysisSchema {
  analysis_type: SchemaFieldState;
  assembly: SchemaFieldState;
  data_characteristics: SchemaFieldState;
  data_source: SchemaFieldState;
  gene_annotation: SchemaFieldState;
  organism: SchemaFieldState;
  workflow: SchemaFieldState;
}

export interface SuggestionChip {
  label: string;
  message: string;
}

export interface AssistantChatRequest {
  message: string;
  session_id?: string;
}

export interface TokenUsage {
  input_tokens: number;
  output_tokens: number;
  requests: number;
  tool_calls: number;
  total_tokens: number;
}

export interface AssistantChatResponse {
  handoff_url: string | null;
  is_complete: boolean;
  reply: string;
  schema_state: AnalysisSchema;
  session_id: string;
  suggestions: SuggestionChip[];
  token_usage?: TokenUsage;
}

export interface UnifiedSearchResponse {
  datasets?: {
    cached: boolean;
    count: number;
    error?: string;
    grouped_studies?: ENAStudyGroup[];
    results: ENAResult[];
    search_method: string;
    study_count?: number;
  } | null;
  interpretation: DatasetInterpretation;
  llm_tokens_used: number;
  model_used: string;
  query: string;
  status: "success" | "partial" | "invalid_query";
  workflows?: {
    count: number;
    error?: string;
    llm_tokens_used: number;
    recommended_workflows: WorkflowRecommendation[];
  } | null;
}
