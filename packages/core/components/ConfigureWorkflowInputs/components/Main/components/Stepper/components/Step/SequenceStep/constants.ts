import { ComponentProps } from "react";

export const ACCEPTED_FILE_TYPES = ".fasta,.fa,.fna,.faa,.ffn";

export const INPUT_PROPS: ComponentProps<"input"> = {
  accept: ACCEPTED_FILE_TYPES,
  "aria-label": "Upload FASTA file",
  hidden: true,
  type: "file",
};
