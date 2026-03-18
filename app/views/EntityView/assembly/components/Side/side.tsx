import { JSX } from "react";
import { Side as BRCSide } from "./brc/side";
import { Side as GA2Side } from "./ga2/side";
import { Props } from "./types";

/**
 * Side component for the AnalyzeView, which conditionally renders different side components based on GA2 or BRC assembly types.
 * @param props - Component props.
 * @param props.assembly - Assembly.
 * @returns A JSX element representing the side column of the AnalyzeView.
 */
export const Side = ({ assembly }: Props): JSX.Element => {
  if ("image" in assembly) return <GA2Side assembly={assembly} />;
  return <BRCSide assembly={assembly} />;
};
