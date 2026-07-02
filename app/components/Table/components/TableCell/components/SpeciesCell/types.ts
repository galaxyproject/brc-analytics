import { LinkProps } from "@databiosphere/findable-ui/lib/components/Links/components/Link/link";
import { ChipProps } from "@mui/material";

export interface SpeciesCellProps {
  accession?: string;
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
