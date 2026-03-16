import { BRCDataCatalogOrganism } from "../../apis/catalog/brc-analytics-catalog/common/entities";
import { GA2OrganismEntity } from "../../apis/catalog/ga2/entities";

export type Organism = BRCDataCatalogOrganism | GA2OrganismEntity;
