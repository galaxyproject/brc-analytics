import { type ChildrenProps } from "@databiosphere/findable-ui/lib/components/types";
import { type JSX } from "react";

/**
 * Renders a scientific (taxon) name in italics, per binomial-nomenclature
 * convention. Intended for genus-and-below taxon names — family/order and
 * other above-genus ranks, plus non-name descriptors, stay roman, so gate
 * before wrapping where a field can carry those. Catalog species fields are
 * wrapped wholesale; embedded qualifiers like "sp." or "cf." inheriting the
 * italic is an accepted trade-off.
 * @param props - Component props.
 * @param props.children - Scientific name.
 * @returns Scientific name element.
 */
export const ScientificName = ({ children }: ChildrenProps): JSX.Element => {
  return <i>{children}</i>;
};
