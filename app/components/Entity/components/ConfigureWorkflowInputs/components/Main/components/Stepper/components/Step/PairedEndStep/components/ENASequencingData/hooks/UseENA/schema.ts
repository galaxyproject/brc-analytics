import { object, string } from "yup";
import { ENA_ACCESSION_REGEX_PATTERN } from "./constants";

export const SCHEMA = object({
  accession: string()
    .required("Accession is required")
    .test(
      "is-valid-ena-accession",
      "Accession is an unsupported ENA ID",
      (value) => {
        if (!value) return true;
        return Object.values(ENA_ACCESSION_REGEX_PATTERN).some((regex) =>
          regex.test(value)
        );
      }
    ),
  accessionType: string()
    .required("Accession type is required")
    .oneOf(
      Object.keys(ENA_ACCESSION_REGEX_PATTERN),
      "Accession type is unsupported"
    ),
});
