import { getGeneModelLabel } from "../../utils";

/**
 * Maps a gene model URL to a form control with display label and value.
 * @param value - The gene model URL.
 * @returns The form control with label and value.
 */
export function mapControl(value: string): { label: string; value: string } {
  return {
    label: getGeneModelLabel(value),
    value,
  };
}
