export type OnRequestData = (
  taxonomyId: string,
  submitOptions?: SubmitOptions
) => Promise<void>;

export interface Status {
  errors: Record<string, string>;
  loading: boolean;
}

export interface SubmitOptions {
  onError?: (error: Error) => void;
  onSuccess?: () => void;
}

export interface UseENADataByTaxonomyId<T> {
  data?: T[];
  status: Status;
}
