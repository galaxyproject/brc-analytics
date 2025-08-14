import { useAsync } from "@databiosphere/findable-ui/lib/hooks/useAsync";
import { FormEvent, useCallback, useState } from "react";
import { parseAccessionList } from "./utils";
import { SubmitOptions, UseENA } from "./types";
import { SCHEMA } from "./schema";
import { ValidationError } from "yup";
import { fetchENAData, fetchENADataByTaxonomy } from "./request";

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

  const onRequestDataByTaxonomy = useCallback(
    async (
      taxonomyId: string,
      submitOptions?: SubmitOptions
    ): Promise<void> => {
      run(
        fetchENADataByTaxonomy({
          submitOptions: {
            onError: () => {
              setErrors({
                accession: "No data was found for the given taxonomy ID.",
              });
              submitOptions?.onError?.();
            },
            onSuccess: () => {
              setErrors({});
              submitOptions?.onSuccess?.();
            },
          },
          taxonomyId,
        })
      );
    },
    [run]
  );

  return {
    clearErrors,
    data,
    onRequestData,
    onRequestDataByTaxonomy,
    status: { errors, loading },
  };
};
