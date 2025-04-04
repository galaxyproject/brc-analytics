import { ColumnMeta } from "@tanstack/react-table";
import { ReadRun } from "../../../../types";

export const META: ColumnMeta<ReadRun, unknown> = {
  width: { max: "1fr", min: "120px" },
};
