import { type JSX } from "react";
import { type Props } from "./types";

/**
 * Renders a scientific (taxon) name in italics, per binomial-nomenclature
 * convention. Applies to genus/species/subspecies names only — strain
 * designators, serotypes and isolate codes stay roman, so wrap just the
 * taxon-name fragment, not surrounding text.
 * @param props - Component props.
 * @param props.children - Scientific name.
 * @returns Scientific name element.
 */
export const ScientificName = ({ children }: Props): JSX.Element => {
  return <i>{children}</i>;
};
