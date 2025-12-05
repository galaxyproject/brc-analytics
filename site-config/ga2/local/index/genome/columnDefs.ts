import { ComponentConfig } from "@databiosphere/findable-ui/lib/config/entities";
import * as C from "../../../../../app/components";
import {
  buildAccession,
  buildGenomeTaxonomicLevelStrain,
  buildAnalyzeGenome,
  buildAnnotationStatus,
  buildChromosomes,
  buildCoverage,
  buildGcPercent,
  buildIsRef,
  buildLength,
  buildLevel,
  buildScaffoldCount,
  buildScaffoldL50,
  buildScaffoldN50,
  buildTaxonomicLevelOrder,
  buildTaxonomicLevelFamily,
  buildTaxonomicLevelGenus,
  buildTaxonomicGroup,
  buildTaxonomyId,
  buildTaxonomicLevelClass,
  buildTaxonomicLevelPhylum,
  buildTaxonomicLevelKingdom,
  buildTaxonomicLevelDomain,
} from "../../../../../app/viewModelBuilders/catalog/brc-analytics-catalog/common/viewModelBuilders";
import { GA2AssemblyEntity } from "../../../../../app/apis/catalog/ga2/entities";
import * as V from "../../../../../app/viewModelBuilders/catalog/ga2/viewModelBuilders";
import { GA2_CATEGORY_LABEL, GA2_CATEGORY_KEY } from "../../../category";
import { ColumnConfig } from "@databiosphere/findable-ui/lib/config/entities";

export const ACCESSION: ColumnConfig<GA2AssemblyEntity> = {
  columnPinned: true,
  componentConfig: {
    component: C.BasicCell,
    viewBuilder: buildAccession,
  } as ComponentConfig<typeof C.BasicCell, GA2AssemblyEntity>,
  header: GA2_CATEGORY_LABEL.ACCESSION,
  id: GA2_CATEGORY_KEY.ACCESSION,
  width: { max: "1fr", min: "164px" },
};

export const ANALYZE_GENOME: ColumnConfig<GA2AssemblyEntity> = {
  componentConfig: {
    component: C.AnalyzeGenome,
    viewBuilder: buildAnalyzeGenome,
  } as ComponentConfig<typeof C.AnalyzeGenome, GA2AssemblyEntity>,
  enableSorting: false,
  enableTableDownload: false,
  header: GA2_CATEGORY_LABEL.ANALYZE_GENOME,
  id: GA2_CATEGORY_KEY.ANALYZE_GENOME,
  width: "auto",
};

export const ANNOTATION_STATUS: ColumnConfig<GA2AssemblyEntity> = {
  componentConfig: {
    component: C.BasicCell,
    viewBuilder: buildAnnotationStatus,
  } as ComponentConfig<typeof C.BasicCell, GA2AssemblyEntity>,
  header: GA2_CATEGORY_LABEL.ANNOTATION_STATUS,
  id: GA2_CATEGORY_KEY.ANNOTATION_STATUS,
  width: { max: "0.5fr", min: "180px" },
};

export const CHROMOSOMES: ColumnConfig<GA2AssemblyEntity> = {
  componentConfig: {
    component: C.BasicCell,
    viewBuilder: buildChromosomes,
  } as ComponentConfig<typeof C.BasicCell, GA2AssemblyEntity>,
  header: GA2_CATEGORY_LABEL.CHROMOSOMES,
  id: GA2_CATEGORY_KEY.CHROMOSOMES,
  width: { max: "0.5fr", min: "142px" },
};

export const COVERAGE: ColumnConfig<GA2AssemblyEntity> = {
  componentConfig: {
    component: C.BasicCell,
    viewBuilder: buildCoverage,
  } as ComponentConfig<typeof C.BasicCell, GA2AssemblyEntity>,
  header: GA2_CATEGORY_LABEL.COVERAGE,
  id: GA2_CATEGORY_KEY.COVERAGE,
  width: { max: "0.5fr", min: "100px" },
};

export const GC_PERCENT: ColumnConfig<GA2AssemblyEntity> = {
  componentConfig: {
    component: C.BasicCell,
    viewBuilder: buildGcPercent,
  } as ComponentConfig<typeof C.BasicCell, GA2AssemblyEntity>,
  header: GA2_CATEGORY_LABEL.GC_PERCENT,
  id: GA2_CATEGORY_KEY.GC_PERCENT,
  width: { max: "0.5fr", min: "100px" },
};

export const IS_REF: ColumnConfig<GA2AssemblyEntity> = {
  componentConfig: {
    component: C.ChipCell,
    viewBuilder: buildIsRef,
  } as ComponentConfig<typeof C.ChipCell, GA2AssemblyEntity>,
  header: GA2_CATEGORY_LABEL.IS_REF,
  id: GA2_CATEGORY_KEY.IS_REF,
  width: { max: "0.5fr", min: "100px" },
};

export const LENGTH: ColumnConfig<GA2AssemblyEntity> = {
  componentConfig: {
    component: C.BasicCell,
    viewBuilder: buildLength,
  } as ComponentConfig<typeof C.BasicCell, GA2AssemblyEntity>,
  header: GA2_CATEGORY_LABEL.LENGTH,
  id: GA2_CATEGORY_KEY.LENGTH,
  width: { max: "0.5fr", min: "132px" },
};

export const LEVEL: ColumnConfig<GA2AssemblyEntity> = {
  componentConfig: {
    component: C.BasicCell,
    viewBuilder: buildLevel,
  } as ComponentConfig<typeof C.BasicCell, GA2AssemblyEntity>,
  header: GA2_CATEGORY_LABEL.LEVEL,
  id: GA2_CATEGORY_KEY.LEVEL,
  width: { max: "0.5fr", min: "142px" },
};

export const SCAFFOLD_COUNT: ColumnConfig<GA2AssemblyEntity> = {
  componentConfig: {
    component: C.BasicCell,
    viewBuilder: buildScaffoldCount,
  } as ComponentConfig<typeof C.BasicCell, GA2AssemblyEntity>,
  header: GA2_CATEGORY_LABEL.SCAFFOLD_COUNT,
  id: GA2_CATEGORY_KEY.SCAFFOLD_COUNT,
  width: { max: "0.5fr", min: "120px" },
};

export const SCAFFOLD_L50: ColumnConfig<GA2AssemblyEntity> = {
  componentConfig: {
    component: C.BasicCell,
    viewBuilder: buildScaffoldL50,
  } as ComponentConfig<typeof C.BasicCell, GA2AssemblyEntity>,
  header: GA2_CATEGORY_LABEL.SCAFFOLD_L50,
  id: GA2_CATEGORY_KEY.SCAFFOLD_L50,
  width: { max: "0.5fr", min: "120px" },
};

export const SCAFFOLD_N50: ColumnConfig<GA2AssemblyEntity> = {
  componentConfig: {
    component: C.BasicCell,
    viewBuilder: buildScaffoldN50,
  } as ComponentConfig<typeof C.BasicCell, GA2AssemblyEntity>,
  header: GA2_CATEGORY_LABEL.SCAFFOLD_N50,
  id: GA2_CATEGORY_KEY.SCAFFOLD_N50,
  width: { max: "0.5fr", min: "120px" },
};

export const TAXONOMIC_LEVEL_DOMAIN: ColumnConfig<GA2AssemblyEntity> = {
  componentConfig: {
    component: C.BasicCell,
    viewBuilder: buildTaxonomicLevelDomain,
  } as ComponentConfig<typeof C.BasicCell, GA2AssemblyEntity>,
  header: GA2_CATEGORY_LABEL.TAXONOMIC_LEVEL_DOMAIN,
  id: GA2_CATEGORY_KEY.TAXONOMIC_LEVEL_DOMAIN,
  width: { max: "1fr", min: "200px" },
};

export const TAXONOMIC_LEVEL_KINGDOM: ColumnConfig<GA2AssemblyEntity> = {
  componentConfig: {
    component: C.BasicCell,
    viewBuilder: buildTaxonomicLevelKingdom,
  } as ComponentConfig<typeof C.BasicCell, GA2AssemblyEntity>,
  header: GA2_CATEGORY_LABEL.TAXONOMIC_LEVEL_KINGDOM,
  id: GA2_CATEGORY_KEY.TAXONOMIC_LEVEL_KINGDOM,
  width: { max: "1fr", min: "200px" },
};

export const TAXONOMIC_LEVEL_PHYLUM: ColumnConfig<GA2AssemblyEntity> = {
  componentConfig: {
    component: C.BasicCell,
    viewBuilder: buildTaxonomicLevelPhylum,
  } as ComponentConfig<typeof C.BasicCell, GA2AssemblyEntity>,
  header: GA2_CATEGORY_LABEL.TAXONOMIC_LEVEL_PHYLUM,
  id: GA2_CATEGORY_KEY.TAXONOMIC_LEVEL_PHYLUM,
  width: { max: "1fr", min: "200px" },
};

export const TAXONOMIC_LEVEL_CLASS: ColumnConfig<GA2AssemblyEntity> = {
  componentConfig: {
    component: C.BasicCell,
    viewBuilder: buildTaxonomicLevelClass,
  } as ComponentConfig<typeof C.BasicCell, GA2AssemblyEntity>,
  header: GA2_CATEGORY_LABEL.TAXONOMIC_LEVEL_CLASS,
  id: GA2_CATEGORY_KEY.TAXONOMIC_LEVEL_CLASS,
  width: { max: "1fr", min: "200px" },
};

export const TAXONOMIC_LEVEL_ORDER: ColumnConfig<GA2AssemblyEntity> = {
  componentConfig: {
    component: C.BasicCell,
    viewBuilder: buildTaxonomicLevelOrder,
  } as ComponentConfig<typeof C.BasicCell, GA2AssemblyEntity>,
  header: GA2_CATEGORY_LABEL.TAXONOMIC_LEVEL_ORDER,
  id: GA2_CATEGORY_KEY.TAXONOMIC_LEVEL_ORDER,
  width: { max: "1fr", min: "200px" },
};

export const TAXONOMIC_LEVEL_FAMILY: ColumnConfig<GA2AssemblyEntity> = {
  componentConfig: {
    component: C.BasicCell,
    viewBuilder: buildTaxonomicLevelFamily,
  } as ComponentConfig<typeof C.BasicCell, GA2AssemblyEntity>,
  header: GA2_CATEGORY_LABEL.TAXONOMIC_LEVEL_FAMILY,
  id: GA2_CATEGORY_KEY.TAXONOMIC_LEVEL_FAMILY,
  width: { max: "1fr", min: "200px" },
};

export const TAXONOMIC_LEVEL_GENUS: ColumnConfig<GA2AssemblyEntity> = {
  componentConfig: {
    component: C.BasicCell,
    viewBuilder: buildTaxonomicLevelGenus,
  } as ComponentConfig<typeof C.BasicCell, GA2AssemblyEntity>,
  header: GA2_CATEGORY_LABEL.TAXONOMIC_LEVEL_GENUS,
  id: GA2_CATEGORY_KEY.TAXONOMIC_LEVEL_GENUS,
  width: { max: "1fr", min: "200px" },
};

export const TAXONOMIC_GROUP: ColumnConfig<GA2AssemblyEntity> = {
  componentConfig: {
    component: C.NTagCell,
    viewBuilder: buildTaxonomicGroup,
  } as ComponentConfig<typeof C.NTagCell, GA2AssemblyEntity>,
  header: GA2_CATEGORY_LABEL.TAXONOMIC_GROUP,
  id: GA2_CATEGORY_KEY.TAXONOMIC_GROUP,
  width: { max: "0.5fr", min: "142px" },
};

export const TAXONOMIC_LEVEL_SPECIES: ColumnConfig<GA2AssemblyEntity> = {
  componentConfig: {
    component: C.Link,
    viewBuilder: V.buildTaxonomicLevelSpecies,
  } as ComponentConfig<typeof C.Link, GA2AssemblyEntity>,
  header: GA2_CATEGORY_LABEL.TAXONOMIC_LEVEL_SPECIES,
  id: GA2_CATEGORY_KEY.TAXONOMIC_LEVEL_SPECIES,
  width: { max: "1fr", min: "200px" },
};

export const TAXONOMIC_LEVEL_STRAIN: ColumnConfig<GA2AssemblyEntity> = {
  componentConfig: {
    component: C.BasicCell,
    viewBuilder: buildGenomeTaxonomicLevelStrain,
  } as ComponentConfig<typeof C.BasicCell, GA2AssemblyEntity>,
  header: GA2_CATEGORY_LABEL.TAXONOMIC_LEVEL_STRAIN,
  id: GA2_CATEGORY_KEY.TAXONOMIC_LEVEL_STRAIN,
  width: { max: "0.5fr", min: "160px" },
};

export const TAXONOMY_ID: ColumnConfig<GA2AssemblyEntity> = {
  componentConfig: {
    component: C.BasicCell,
    viewBuilder: buildTaxonomyId,
  } as ComponentConfig<typeof C.BasicCell, GA2AssemblyEntity>,
  header: GA2_CATEGORY_LABEL.TAXONOMY_ID,
  id: GA2_CATEGORY_KEY.TAXONOMY_ID,
  width: { max: "0.5fr", min: "144px" },
};

export const ORGANISM_IMAGE: ColumnConfig<GA2AssemblyEntity> = {
  componentConfig: {
    component: C.OrganismAvatar,
    viewBuilder: V.buildOrganismImageThumbnail,
  } as ComponentConfig<typeof C.OrganismAvatar, GA2AssemblyEntity>,
  header: GA2_CATEGORY_LABEL.ORGANISM_AVATAR,
  id: GA2_CATEGORY_KEY.ORGANISM_AVATAR,
  width: { max: "100px", min: "100px" },
};
