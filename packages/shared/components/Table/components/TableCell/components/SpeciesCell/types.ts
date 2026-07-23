import type { LinkProps } from "@databiosphere/findable-ui/lib/components/Links/components/Link/link";
import type { ChipProps } from "@mui/material";

export interface Props {
  ncbiTaxonomyId?: string;
  species: LinkProps;
  tags?: SpeciesTag[];
}

export interface SpeciesTag {
  color?: ChipProps["color"];
  label: string;
  tooltip?: string;
  value: string;
}
