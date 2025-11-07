import { useAsync } from "@databiosphere/findable-ui/lib/hooks/useAsync";
import { FormEvent, useCallback, useState } from "react";
import { parseAccessionList } from "./utils";
import { SubmitOptions, UseENADataByAccession } from "./types";
import { SCHEMA } from "./schema";
import { ValidationError } from "yup";
import { fetchENAData } from "./request";

export const useENADataByAccession = <T>(): UseENADataByAccession<T> => {
  const { data, isLoading: loading, run } = useAsync<T[] | undefined>();
  const [errors, setErrors] = useState<Record<string, string>>({});

  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  const onRequestData = useCallback(
    async (
      event: FormEvent,
      submitOptions: SubmitOptions<T>
    ): Promise<void> => {
      event.preventDefault();
      const form = event.target as HTMLFormElement;
      const formData = new FormData(form);
      const inputValues = {
        accession: formData.get("accession"),
      };

      SCHEMA.validate(inputValues, { abortEarly: false })
        .then((result) => {
          const accessionsInfo = parseAccessionList(
            result.accession,
            "accession"
          );
          if (accessionsInfo.length === 0)
            throw new ValidationError(
              "Accession is required",
              inputValues.accession,
              "accession"
            );
          run(
            fetchENAData({
              accessionsInfo,
              submitOptions: {
                onError: (e: Error) => {
                  setErrors({ accession: e.message });
                  submitOptions.onError?.(e);
                },
                onSuccess: (data: T[]) => {
                  setErrors({});
                  submitOptions.onSuccess?.(data);
                },
              },
            })
          );
        })
        .catch((validationError: ValidationError) => {
          const fieldErrors: Record<string, string> = {};
          const validationErrors = validationError.inner.length
            ? validationError.inner
            : [validationError];
          for (const error of validationErrors) {
            if (error.path) fieldErrors[error.path] = error.message;
          }
          setErrors(fieldErrors);
        });
    },
    [run]
  );

  return {
    actions: { clearErrors, onRequestData },
    data,
    status: { errors, loading },
  };
};
