import { object, string } from "yup";

export const SCHEMA = object({
  accession: string().required("Accession is required"),
});
