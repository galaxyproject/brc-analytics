import {
  ColumnConfig,
  ComponentConfig,
} from "@databiosphere/findable-ui/lib/config/entities";
import * as C from "../../../../../app/components";
import { buildOrganismAssemblyTaxonomyIds } from "../../../../../app/viewModelBuilders/catalog/brc-analytics-catalog/common/viewModelBuilders";
import { GA2_CATEGORY_KEY, GA2_CATEGORY_LABEL } from "../../../category";
import { GA2OrganismEntity } from "../../../../../app/apis/catalog/ga2/entities";
import {
  buildAssemblyCount,
  buildTaxonomicGroup,
} from "app/viewModelBuilders/catalog/brc-analytics-catalog/common/viewModelBuilders";
import * as V from "../../../../../app/viewModelBuilders/catalog/ga2/viewModelBuilders";

export const ASSEMBLY_COUNT: ColumnConfig<GA2OrganismEntity> = {
  componentConfig: {
    component: C.BasicCell,
    viewBuilder: buildAssemblyCount,
  } as ComponentConfig<typeof C.BasicCell, GA2OrganismEntity>,
  header: GA2_CATEGORY_LABEL.ASSEMBLY_COUNT,
  id: GA2_CATEGORY_KEY.ASSEMBLY_COUNT,
  width: { max: "0.65fr", min: "164px" },
};

export const ASSEMBLY_TAXONOMY_IDS: ColumnConfig<GA2OrganismEntity> = {
  componentConfig: {
    component: C.NTagCell,
    viewBuilder: buildOrganismAssemblyTaxonomyIds,
  } as ComponentConfig<typeof C.NTagCell, GA2OrganismEntity>,
  header: GA2_CATEGORY_LABEL.ASSEMBLY_TAXONOMY_IDS,
  id: GA2_CATEGORY_KEY.ASSEMBLY_TAXONOMY_IDS,
  width: { max: "0.65fr", min: "164px" },
};

export const TAXONOMIC_GROUP: ColumnConfig<GA2OrganismEntity> = {
  componentConfig: {
    component: C.NTagCell,
    viewBuilder: buildTaxonomicGroup,
  } as ComponentConfig<typeof C.NTagCell, GA2OrganismEntity>,
  header: GA2_CATEGORY_LABEL.TAXONOMIC_GROUP,
  id: GA2_CATEGORY_KEY.TAXONOMIC_GROUP,
  width: { max: "0.65fr", min: "164px" },
};

export const TAXONOMIC_LEVEL_SPECIES: ColumnConfig<GA2OrganismEntity> = {
  componentConfig: {
    component: C.Link,
    viewBuilder: V.buildOrganismSpecies,
  } as ComponentConfig<typeof C.Link, GA2OrganismEntity>,
  header: GA2_CATEGORY_LABEL.TAXONOMIC_LEVEL_SPECIES,
  id: GA2_CATEGORY_KEY.TAXONOMIC_LEVEL_SPECIES,
  meta: { columnPinned: true },
  width: { max: "1fr", min: "auto" },
};
