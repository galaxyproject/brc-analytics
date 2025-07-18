import { FormEvent } from "react";

export type OnRequestData = (
  event: FormEvent,
  submitOptions: SubmitOptions
) => Promise<void>;

export interface Status {
  errors: Record<string, string>;
  loading: boolean;
}

export interface SubmitOptions {
  onError?: () => void;
  onSuccess?: () => void;
}

export interface UseENA<T> {
  clearErrors: () => void;
  data?: T[];
  onRequestData: OnRequestData;
  status: Status;
}
