import { type Outbreak } from "@brc/apis/outbreak";
import { buildPriorityPathogenDetails } from "@brc/viewModelBuilders/viewModelBuilders";
import { ScientificName } from "@repo/shared/components/ScientificName/scientificName";
import { renderScientificName } from "@repo/shared/components/Table/components/TableCell/components/ScientificName/utils";
import { renderWorkflowSpecies } from "@repo/shared/viewModelBuilders/viewModelBuilders";
import { type CellContext } from "@tanstack/react-table";
import { isValidElement, type ReactElement } from "react";

/**
 * Builds a minimal cell context exposing just the value the renderers read.
 * @param value - Cell value.
 * @returns Cell context stub.
 */
function mockCellContext(
  value: string | undefined
): CellContext<unknown, unknown> {
  return { getValue: () => value } as unknown as CellContext<unknown, unknown>;
}

/**
 * Builds a minimal priority pathogen with the given taxon name and rank field.
 * @param taxonNameField - Rank discriminator for the taxon name.
 * @returns Priority pathogen stub.
 */
function mockPriorityPathogen(taxonNameField: string): Outbreak {
  return {
    name: "Test pathogen",
    priority: "CRITICAL",
    taxonName: "Aspergillus",
    taxonNameField,
  } as unknown as Outbreak;
}

describe("renderScientificName", () => {
  test("wraps a present value", () => {
    const result = renderScientificName(mockCellContext("Homo sapiens"));

    expect(isValidElement(result) && result.type).toBe(ScientificName);
  });

  test("passes an absent value through as null", () => {
    expect(renderScientificName(mockCellContext(undefined))).toBeNull();
  });
});

describe("renderWorkflowSpecies", () => {
  test("wraps a real species name", () => {
    const result = renderWorkflowSpecies(mockCellContext("Homo sapiens"));

    expect(isValidElement(result) && result.type).toBe(ScientificName);
  });

  test("keeps the Any sentinel roman", () => {
    expect(renderWorkflowSpecies(mockCellContext("Any"))).toBe("Any");
  });

  test("passes an absent value through as null", () => {
    expect(renderWorkflowSpecies(mockCellContext(undefined))).toBeNull();
  });
});

describe("buildPriorityPathogenDetails taxon-name rank gating", () => {
  /**
   * Returns the Organisms link's child for the given rank field.
   * @param taxonNameField - Rank discriminator for the taxon name.
   * @returns The taxon label rendered inside the link.
   */
  function getTaxonLabel(taxonNameField: string): unknown {
    const { keyValuePairs } = buildPriorityPathogenDetails(
      mockPriorityPathogen(taxonNameField)
    );
    const link = keyValuePairs?.get("Organisms") as ReactElement<{
      children: unknown;
    }>;
    return link.props.children;
  }

  test("italicizes a species-rank taxon name", () => {
    const label = getTaxonLabel("taxonomicLevelSpecies");

    expect(isValidElement(label) && label.type).toBe(ScientificName);
  });

  test("italicizes a genus-rank taxon name", () => {
    const label = getTaxonLabel("taxonomicLevelGenus");

    expect(isValidElement(label) && label.type).toBe(ScientificName);
  });

  test("keeps a family-rank taxon name roman", () => {
    expect(getTaxonLabel("taxonomicLevelFamily")).toBe("Aspergillus");
  });
});
