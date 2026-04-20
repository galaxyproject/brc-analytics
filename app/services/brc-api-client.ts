import ky, { HTTPError } from "ky";
import { API_BASE_URL } from "../config/api";
import {
  FavoriteResponse,
  UserMeResponse,
  UserPreferences,
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

  deleteFavorite: async (
    entity_id: string,
    entity_type = "assembly"
  ): Promise<void> => {
    await apiClient.delete(`favorites/${entity_type}/${entity_id}`);
  },

  getFavorites: async (
    entity_type = "assembly"
  ): Promise<FavoriteResponse[]> => {
    return apiClient.get("favorites", { searchParams: { entity_type } }).json();
  },

  getPreferences: async (): Promise<UserPreferences> => {
    return apiClient.get("user/preferences").json();
  },

  getUser: async (): Promise<UserMeResponse> => {
    return apiClient.get("user/me").json();
  },

  updatePreferences: async (
    preferences: UserPreferences
  ): Promise<UserPreferences> => {
    return apiClient.put("user/preferences", { json: preferences }).json();
  },
};
