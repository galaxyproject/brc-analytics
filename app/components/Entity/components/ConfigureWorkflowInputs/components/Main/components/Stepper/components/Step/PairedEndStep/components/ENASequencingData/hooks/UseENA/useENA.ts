import { useAsync } from "@databiosphere/findable-ui/lib/hooks/useAsync";
import { FormEvent, useCallback, useState } from "react";
import { fetchENAData, getAccessionType } from "./utils";
import { SubmitOptions, UseENA } from "./types";

export const useENA = <T>(): UseENA<T> => {
  const { data, isLoading: loading, run } = useAsync<T[]>();
  const [error, setError] = useState<boolean>(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const onRequestData = useCallback(
    async (event: FormEvent, submitOptions: SubmitOptions): Promise<void> => {
      event.preventDefault();
      const form = event.target as HTMLFormElement;
      const formData = new FormData(form);
      const accession = formData.get("accession");

      if (!accession) {
        setError(true);
        setErrors({ accession: "Accession is required." });
        return;
      }

      if (typeof accession !== "string") {
        setError(true);
        setErrors({ accession: "Invalid accession type." });
        return;
      }

      const accessionType = getAccessionType(accession);

      if (!accessionType) {
        setError(true);
        setErrors({ accession: "Unsupported accession type." });
        return;
      }

      try {
        await run(
          fetchENAData({
            accession,
            accessionType,
            submitOptions: {
              onError: () => {
                setError(true);
                setErrors({
                  accession:
                    "Accessions were not found. Please check the IDs and try again.",
                });
                submitOptions.onError?.();
              },
              onSuccess: () => {
                setError(false);
                setErrors({});
                submitOptions.onSuccess?.();
              },
            },
          })
        );
      } catch (error) {
        console.error("Error processing accession data:", error);
      }
    },
    [run]
  );

  return {
    data,
    onRequestData,
    requestStatus: { error, errors, loading },
  };
};
