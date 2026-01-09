import { ComponentProps } from "react";

export const ACCEPTED_FILE_TYPES = ".csv,.tsv";

export const INPUT_PROPS: ComponentProps<"input"> = {
  accept: ACCEPTED_FILE_TYPES,
  hidden: true,
  type: "file",
};
