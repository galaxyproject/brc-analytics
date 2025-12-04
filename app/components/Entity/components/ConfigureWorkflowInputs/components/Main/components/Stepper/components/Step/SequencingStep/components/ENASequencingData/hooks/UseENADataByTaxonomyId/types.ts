export type OnRequestData<T> = (
  taxonomyId: string,
  submitOptions?: SubmitOptions<T>
) => Promise<void>;

export interface Status {
  eligible: boolean;
  errors: Record<string, string>;
  loading: boolean;
}

export interface SubmitOptions<T> {
  onError?: (error: Error) => void;
  onSuccess?: (data: T[]) => void;
}

export interface UseENADataByTaxonomyId<T> {
  data?: T[];
  status: Status;
}
