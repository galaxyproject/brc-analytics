import { FormEvent } from "react";

export interface Actions<T> {
  clearErrors: () => void;
  onRequestData: OnRequestData<T>;
}

export type OnRequestData<T> = (
  event: FormEvent,
  submitOptions: SubmitOptions<T>
) => Promise<void>;

export interface Status {
  errors: Record<string, string>;
  loading: boolean;
}

export interface SubmitOptions<T> {
  onError?: (error: Error) => void;
  onSuccess?: (data: T[]) => void;
}

export interface UseENADataByAccession<T> {
  actions: Actions<T>;
  data?: T[];
  status: Status;
}
