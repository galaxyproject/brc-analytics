import { useAsync } from "@databiosphere/findable-ui/lib/hooks/useAsync";
import { FormEvent, useCallback, useState } from "react";
import { getAccessionType } from "./utils";
import { SubmitOptions, UseENA } from "./types";
import { SCHEMA } from "./schema";
import { ValidationError } from "yup";
import { fetchENAData } from "./request";

export const useENA = <T>(): UseENA<T> => {
  const { data, isLoading: loading, run } = useAsync<T[] | undefined>();
  const [errors, setErrors] = useState<Record<string, string>>({});

  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  const onRequestData = useCallback(
    async (event: FormEvent, submitOptions: SubmitOptions): Promise<void> => {
      event.preventDefault();
      const form = event.target as HTMLFormElement;
      const formData = new FormData(form);
      const accession = formData.get("accession");
      const accessionType = getAccessionType(accession);

      SCHEMA.validate({ accession, accessionType }, { abortEarly: false })
        .then((result) => {
          run(
            fetchENAData({
              accession: result.accession,
              accessionType: result.accessionType,
              submitOptions: {
                onError: () => {
                  setErrors({
                    accession:
                      "Accessions were not found. Please check the IDs and try again.",
                  });
                  submitOptions.onError?.();
                },
                onSuccess: () => {
                  setErrors({});
                  submitOptions.onSuccess?.();
                },
              },
            })
          );
        })
        .catch((validationError: ValidationError) => {
          const fieldErrors: Record<string, string> = {};
          for (const error of validationError.inner) {
            if (error.path) fieldErrors[error.path] = error.message;
          }
          setErrors(fieldErrors);
        });
    },
    [run]
  );

  return {
    clearErrors,
    data,
    onRequestData,
    status: { errors, loading },
  };
};
