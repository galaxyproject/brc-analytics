import { ColumnFiltersState } from "@tanstack/react-table";

export type OnRequestData<T> = (
  taxonomyId: string,
  submitOptions?: SubmitOptions<T>
) => Promise<void>;

export interface Status {
  errors: Record<string, string>;
  loading: boolean;
}

export interface SubmitOptions<T> {
  onError?: (error: Error) => void;
  onSuccess?: (data: T[]) => void;
}

export interface UseENADataByTaxonomyId<T> {
  columnFilters: ColumnFiltersState;
  data?: T[];
  status: Status;
}
