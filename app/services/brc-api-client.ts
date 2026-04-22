import ky, { HTTPError } from "ky";
import { API_BASE_URL } from "../config/api";
import {
  FavoriteResponse,
  SavedAnalysisDetail,
  SavedAnalysisRestoreResponse,
  SavedAnalysisSummary,
  UserMeResponse,
  UserPreferences,
  WorkflowRunCreateRequest,
  WorkflowRunResponse,
} from "../types/api";

const apiClient = ky.create({
  credentials: "include",
  hooks: {
    beforeError: [
      (error): HTTPError => {
        const { response } = error;
        if (response && response.body) {
          error.name = "APIError";
          error.message = `${response.status}: ${response.statusText}`;
        }
        return error;
      },
    ],
  },
  prefixUrl: API_BASE_URL,
  timeout: 30000,
});

export const brcAPIClient = {
  createFavorite: async (
    entity_id: string,
    entity_type = "assembly"
  ): Promise<FavoriteResponse> => {
    return apiClient
      .post("favorites", { json: { entity_id, entity_type } })
      .json();
  },

  createWorkflowRun: async (
    payload: WorkflowRunCreateRequest
  ): Promise<WorkflowRunResponse> => {
    return apiClient.post("workflow_runs", { json: payload }).json();
  },

  deleteFavorite: async (
    entity_id: string,
    entity_type = "assembly"
  ): Promise<void> => {
    await apiClient.delete(`favorites/${entity_type}/${entity_id}`);
  },

  deleteSavedAnalysis: async (id: string): Promise<void> => {
    await apiClient.delete(`saved_analyses/${id}`);
  },

  getFavorites: async (
    entity_type = "assembly"
  ): Promise<FavoriteResponse[]> => {
    return apiClient.get("favorites", { searchParams: { entity_type } }).json();
  },

  getPreferences: async (): Promise<UserPreferences> => {
    return apiClient.get("user/preferences").json();
  },

  getSavedAnalyses: async (): Promise<SavedAnalysisSummary[]> => {
    return apiClient.get("saved_analyses").json();
  },

  getSavedAnalysis: async (id: string): Promise<SavedAnalysisDetail> => {
    return apiClient.get(`saved_analyses/${id}`).json();
  },

  getUser: async (): Promise<UserMeResponse> => {
    return apiClient.get("user/me").json();
  },

  getWorkflowRuns: async (): Promise<WorkflowRunResponse[]> => {
    return apiClient.get("workflow_runs").json();
  },

  restoreSavedAnalysis: async (
    id: string
  ): Promise<SavedAnalysisRestoreResponse> => {
    return apiClient.post(`saved_analyses/${id}/restore`).json();
  },

  saveAnalysis: async (
    session_id: string,
    title?: string
  ): Promise<SavedAnalysisSummary> => {
    return apiClient
      .post("saved_analyses", { json: { session_id, title } })
      .json();
  },

  updatePreferences: async (
    preferences: UserPreferences
  ): Promise<UserPreferences> => {
    return apiClient.put("user/preferences", { json: preferences }).json();
  },
};
