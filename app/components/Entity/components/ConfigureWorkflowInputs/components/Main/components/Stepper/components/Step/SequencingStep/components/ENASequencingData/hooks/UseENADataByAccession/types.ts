import { FormEvent } from "react";

export interface Actions {
  clearErrors: () => void;
  onRequestData: OnRequestData;
}

export type OnRequestData = (
  event: FormEvent,
  submitOptions: SubmitOptions
) => Promise<void>;

export interface Status {
  errors: Record<string, string>;
  loading: boolean;
}

export interface SubmitOptions {
  onError?: (error: Error) => void;
  onSuccess?: () => void;
}

export interface UseENADataByAccession<T> {
  actions: Actions;
  data?: T[];
  status: Status;
}
