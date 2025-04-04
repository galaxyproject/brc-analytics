import { FormEvent } from "react";

export type ClearErrors = (fieldName: string) => void;

export type OnRequestData = (
  event: FormEvent,
  submitOptions: SubmitOptions
) => Promise<void>;

export interface RequestStatus {
  error: boolean;
  errors: Record<string, string>;
  loading: boolean;
  success: boolean;
}

export interface SubmitOptions {
  onError?: () => void;
  onSuccess?: () => void;
  onValid?: () => void;
}

export interface UseENA<T> {
  clearErrors: ClearErrors;
  data?: T[];
  onRequestData: OnRequestData;
  requestStatus: RequestStatus;
}
