import { FormEvent } from "react";

export type OnRequestData = (
  event: FormEvent,
  submitOptions: SubmitOptions
) => Promise<void>;

export interface RequestStatus {
  error: boolean;
  errors: Record<string, string>;
  loading: boolean;
}

export interface SubmitOptions {
  onError?: () => void;
  onSuccess?: () => void;
}

export interface UseENA<T> {
  data?: T[];
  onRequestData: OnRequestData;
  requestStatus: RequestStatus;
}
