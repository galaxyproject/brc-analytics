import {
  Key,
  Value,
} from "@databiosphere/findable-ui/lib/components/common/KeyValuePairs/keyValuePairs";
import { ComponentProps } from "react";
import * as C from "../../../../components";
import type { Organism } from "../../types";

/**
 * Build props for the organism details key-value pairs.
 * @param organism - Organism.
 * @returns Props for the KeyValuePairs component.
 */
export function buildOrganismDetails(
  organism: Organism
): ComponentProps<typeof C.KeyValuePairs> {
  const keyValuePairs = new Map<Key, Value>();
  keyValuePairs.set("Species", organism.taxonomicLevelSpecies);
  keyValuePairs.set(
    "Taxonomy ID",
    C.CopyText({
      children: organism.ncbiTaxonomyId,
      value: organism.ncbiTaxonomyId,
    })
  );
  keyValuePairs.set("Assembly Count", String(organism.assemblyCount));
  return {
    KeyElType: C.KeyElType,
    KeyValuesElType: (props) => C.Stack({ ...props, gap: 4 }),
    ValueElType: C.ValueElType,
    keyValuePairs,
  };
}
