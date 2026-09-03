import { API_BASE_URL } from "@repo/shared/config/api";
import ky, { type HTTPError } from "ky";
import type {
  FavoriteResponse,
  SavedAnalysisDetail,
  SavedAnalysisRestoreResponse,
  SavedAnalysisSummary,
  UserMeResponse,
  WorkflowRunCreateRequest,
  WorkflowRunResponse,
} from "./types";

const httpClient = ky.create({
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

export const apiClient = {
  createFavorite: async (
    entity_id: string,
    entity_type: string
  ): Promise<FavoriteResponse> => {
    return httpClient
      .post("favorites", { json: { entity_id, entity_type } })
      .json();
  },

  createWorkflowRun: async (
    payload: WorkflowRunCreateRequest
  ): Promise<WorkflowRunResponse> => {
    return httpClient.post("workflow_runs", { json: payload }).json();
  },

  deleteFavorite: async (
    entity_id: string,
    entity_type: string
  ): Promise<void> => {
    await httpClient.delete(`favorites/${entity_type}/${entity_id}`);
  },

  deleteSavedAnalysis: async (id: string): Promise<void> => {
    await httpClient.delete(`saved_analyses/${id}`);
  },

  getFavorites: async (entity_type?: string): Promise<FavoriteResponse[]> => {
    return httpClient
      .get("favorites", {
        searchParams: entity_type ? { entity_type } : undefined,
      })
      .json();
  },

  getSavedAnalyses: async (): Promise<SavedAnalysisSummary[]> => {
    return httpClient.get("saved_analyses").json();
  },

  getSavedAnalysis: async (id: string): Promise<SavedAnalysisDetail> => {
    return httpClient.get(`saved_analyses/${id}`).json();
  },

  getUser: async (): Promise<UserMeResponse> => {
    return httpClient.get("user/me").json();
  },

  getWorkflowRuns: async (): Promise<WorkflowRunResponse[]> => {
    return httpClient.get("workflow_runs").json();
  },

  openSavedAnalysis: async (
    id: string
  ): Promise<SavedAnalysisRestoreResponse> => {
    return httpClient.post(`saved_analyses/${id}/open`).json();
  },
};
