import { LinkProps } from "@databiosphere/findable-ui/lib/components/Links/components/Link/link";
import { ChipProps, TooltipProps } from "@mui/material";

export interface PriorityPathogen {
  chip: ChipProps;
  tooltip: Omit<TooltipProps, "children">;
}

export interface SpeciesCellProps {
  ncbiTaxonomyId?: string;
  priorityPathogen?: PriorityPathogen;
  species: LinkProps;
  tags?: SpeciesTag[];
}

export interface SpeciesTag {
  label: string;
  value: string;
}
