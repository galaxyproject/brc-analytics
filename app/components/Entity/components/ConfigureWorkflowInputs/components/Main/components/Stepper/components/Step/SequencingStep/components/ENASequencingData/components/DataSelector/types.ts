import { BRCDataCatalogGenome } from "../../../../../../../../../../../../../../../apis/catalog/brc-analytics-catalog/common/entities";
import { OnRequestDataByTaxonomy } from "../../hooks/UseENA/types";

export interface Props {
  genome: BRCDataCatalogGenome;
  onContinue: () => void;
  onOpen: () => void;
  onRequestDataByTaxonomy: OnRequestDataByTaxonomy;
  selectedCount: number;
}
