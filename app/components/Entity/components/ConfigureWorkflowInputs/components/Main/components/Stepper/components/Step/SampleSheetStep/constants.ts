import { ComponentProps } from "react";

export const ACCEPTED_FILE_TYPES = ".csv,.tsv";

export const INPUT_PROPS: ComponentProps<"input"> = {
  accept: ACCEPTED_FILE_TYPES,
  "aria-label": "Upload sample sheet file",
  hidden: true,
  type: "file",
};
