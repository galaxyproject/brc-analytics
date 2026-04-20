// API types for the Analysis Assistant

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

export interface SessionRestoreResponse {
  handoff_url: string | null;
  is_complete: boolean;
  messages: { content: string; role: "user" | "assistant" }[];
  schema_state: AnalysisSchema;
  session_id: string;
  suggestions: SuggestionChip[];
}

export interface AssistantInfoResponse {
  available: boolean;
  model: string | null;
  provider: string | null;
}

export interface UserPreferences {
  [key: string]: unknown;
}

export interface UserMeResponse {
  email: string | null;
  email_verified: boolean | null;
  family_name: string | null;
  given_name: string | null;
  name: string | null;
  preferences: UserPreferences;
  preferred_username: string | null;
  realm_roles: string[];
  sub: string;
}

export interface FavoriteResponse {
  created_at: string;
  entity_id: string;
  entity_type: string;
}
