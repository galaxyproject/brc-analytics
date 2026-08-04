import {
  buildAccession,
  buildAnnotationStatus,
  buildAssemblyTaxonomicGroup,
  buildChromosomes,
  buildCoverage,
  buildGcPercent,
  buildGenomeTaxonomicLevelStrain,
  buildLength,
  buildScaffoldCount,
  buildScaffoldL50,
  buildScaffoldN50,
  buildTaxonomicLevelClass,
  buildTaxonomicLevelDomain,
  buildTaxonomicLevelFamily,
  buildTaxonomicLevelGenus,
  buildTaxonomicLevelKingdom,
  buildTaxonomicLevelOrder,
  buildTaxonomicLevelPhylum,
  buildTaxonomyId,
} from "@brc/viewModelBuilders/viewModelBuilders";
import { BasicCell } from "@databiosphere/findable-ui/lib/components/Table/components/TableCell/components/BasicCell/basicCell";
import { ChipCell } from "@databiosphere/findable-ui/lib/components/Table/components/TableCell/components/ChipCell/chipCell";
import { NTagCell } from "@databiosphere/findable-ui/lib/components/Table/components/TableCell/components/NTagCell/nTagCell";
import {
  type ColumnConfig,
  type ComponentConfig,
} from "@databiosphere/findable-ui/lib/config/entities";
import { type GA2AssemblyEntity } from "@ga2/apis/assembly";
import { OrganismAvatar } from "@ga2/components/OrganismAvatar/organismAvatar";
import * as V from "@ga2/viewModelBuilders/viewModelBuilders";
import { AnalyzeGenome } from "@repo/shared/components/Table/components/TableCell/components/AnalyzeGenome/analyzeGenome";
import { LevelCell } from "@repo/shared/components/Table/components/TableCell/components/LevelCell/levelCell";
import { SpeciesCell } from "@repo/shared/components/Table/components/TableCell/components/SpeciesCell/speciesCell";
import { Tooltip } from "@repo/shared/components/Tooltip/tooltip";
import {
  buildAnalyzeGenome,
  buildIsRef,
  buildLevel,
  buildReleaseDate,
  buildReleaseDateTooltip,
} from "@repo/shared/viewModelBuilders/viewModelBuilders";
import {
  GA2_CATEGORY_KEY,
  GA2_CATEGORY_LABEL,
} from "@site-config/ga2/category";

export const ACCESSION: ColumnConfig<GA2AssemblyEntity> = {
  componentConfig: {
    component: BasicCell,
    viewBuilder: buildAccession,
  } as ComponentConfig<typeof BasicCell, GA2AssemblyEntity>,
  header: GA2_CATEGORY_LABEL.ACCESSION,
  id: GA2_CATEGORY_KEY.ACCESSION,
  width: { max: "1fr", min: "164px" },
};

export const ANALYZE_GENOME: ColumnConfig<GA2AssemblyEntity> = {
  componentConfig: {
    component: AnalyzeGenome,
    viewBuilder: buildAnalyzeGenome,
  } as ComponentConfig<typeof AnalyzeGenome, GA2AssemblyEntity>,
  enableSorting: false,
  enableTableDownload: false,
  header: GA2_CATEGORY_LABEL.ANALYZE_GENOME,
  id: GA2_CATEGORY_KEY.ANALYZE_GENOME,
  width: "auto",
};

export const ANNOTATION_STATUS: ColumnConfig<GA2AssemblyEntity> = {
  componentConfig: {
    component: BasicCell,
    viewBuilder: buildAnnotationStatus,
  } as ComponentConfig<typeof BasicCell, GA2AssemblyEntity>,
  header: GA2_CATEGORY_LABEL.ANNOTATION_STATUS,
  id: GA2_CATEGORY_KEY.ANNOTATION_STATUS,
  width: { max: "0.5fr", min: "180px" },
};

export const CHROMOSOMES: ColumnConfig<GA2AssemblyEntity> = {
  componentConfig: {
    component: BasicCell,
    viewBuilder: buildChromosomes,
  } as ComponentConfig<typeof BasicCell, GA2AssemblyEntity>,
  header: GA2_CATEGORY_LABEL.CHROMOSOMES,
  id: GA2_CATEGORY_KEY.CHROMOSOMES,
  width: { max: "0.5fr", min: "142px" },
};

export const COVERAGE: ColumnConfig<GA2AssemblyEntity> = {
  componentConfig: {
    component: BasicCell,
    viewBuilder: buildCoverage,
  } as ComponentConfig<typeof BasicCell, GA2AssemblyEntity>,
  header: GA2_CATEGORY_LABEL.COVERAGE,
  id: GA2_CATEGORY_KEY.COVERAGE,
  width: { max: "0.5fr", min: "100px" },
};

export const GC_PERCENT: ColumnConfig<GA2AssemblyEntity> = {
  componentConfig: {
    component: BasicCell,
    viewBuilder: buildGcPercent,
  } as ComponentConfig<typeof BasicCell, GA2AssemblyEntity>,
  header: GA2_CATEGORY_LABEL.GC_PERCENT,
  id: GA2_CATEGORY_KEY.GC_PERCENT,
  width: { max: "0.5fr", min: "100px" },
};

export const IS_REF: ColumnConfig<GA2AssemblyEntity> = {
  componentConfig: {
    component: ChipCell,
    viewBuilder: buildIsRef,
  } as ComponentConfig<typeof ChipCell, GA2AssemblyEntity>,
  header: GA2_CATEGORY_LABEL.IS_REF,
  id: GA2_CATEGORY_KEY.IS_REF,
  width: { max: "0.5fr", min: "100px" },
};

export const LENGTH: ColumnConfig<GA2AssemblyEntity> = {
  componentConfig: {
    component: BasicCell,
    viewBuilder: buildLength,
  } as ComponentConfig<typeof BasicCell, GA2AssemblyEntity>,
  header: GA2_CATEGORY_LABEL.LENGTH,
  id: GA2_CATEGORY_KEY.LENGTH,
  width: { max: "0.5fr", min: "132px" },
};

export const LEVEL: ColumnConfig<GA2AssemblyEntity> = {
  componentConfig: {
    component: LevelCell,
    viewBuilder: buildLevel,
  } as ComponentConfig<typeof LevelCell, GA2AssemblyEntity>,
  header: GA2_CATEGORY_LABEL.LEVEL,
  id: GA2_CATEGORY_KEY.LEVEL,
  width: { max: "0.5fr", min: "142px" },
};

export const RELEASE_DATE: ColumnConfig<GA2AssemblyEntity> = {
  componentConfig: {
    children: [
      {
        component: BasicCell,
        viewBuilder: buildReleaseDate,
      } as ComponentConfig<typeof BasicCell, GA2AssemblyEntity>,
    ],
    component: Tooltip,
    viewBuilder: buildReleaseDateTooltip,
    // The shared release-date builders take the site-neutral AssemblyContract,
    // which TS can't reconcile with this cast: ComponentConfig's data type is
    // invariant and the Tooltip viewBuilder omits `children` (supplied above).
    // Double cast is the repo's escape-hatch for this findable-ui limitation.
  } as unknown as ComponentConfig<typeof Tooltip, GA2AssemblyEntity>,
  header: GA2_CATEGORY_LABEL.RELEASE_DATE,
  id: GA2_CATEGORY_KEY.RELEASE_DATE,
  width: { max: "1fr", min: "120px" },
};

export const SCAFFOLD_COUNT: ColumnConfig<GA2AssemblyEntity> = {
  componentConfig: {
    component: BasicCell,
    viewBuilder: buildScaffoldCount,
  } as ComponentConfig<typeof BasicCell, GA2AssemblyEntity>,
  header: GA2_CATEGORY_LABEL.SCAFFOLD_COUNT,
  id: GA2_CATEGORY_KEY.SCAFFOLD_COUNT,
  width: { max: "0.5fr", min: "120px" },
};

export const SCAFFOLD_L50: ColumnConfig<GA2AssemblyEntity> = {
  componentConfig: {
    component: BasicCell,
    viewBuilder: buildScaffoldL50,
  } as ComponentConfig<typeof BasicCell, GA2AssemblyEntity>,
  header: GA2_CATEGORY_LABEL.SCAFFOLD_L50,
  id: GA2_CATEGORY_KEY.SCAFFOLD_L50,
  width: { max: "0.5fr", min: "120px" },
};

export const SCAFFOLD_N50: ColumnConfig<GA2AssemblyEntity> = {
  componentConfig: {
    component: BasicCell,
    viewBuilder: buildScaffoldN50,
  } as ComponentConfig<typeof BasicCell, GA2AssemblyEntity>,
  header: GA2_CATEGORY_LABEL.SCAFFOLD_N50,
  id: GA2_CATEGORY_KEY.SCAFFOLD_N50,
  width: { max: "0.5fr", min: "120px" },
};

export const TAXONOMIC_LEVEL_DOMAIN: ColumnConfig<GA2AssemblyEntity> = {
  componentConfig: {
    component: BasicCell,
    viewBuilder: buildTaxonomicLevelDomain,
  } as ComponentConfig<typeof BasicCell, GA2AssemblyEntity>,
  header: GA2_CATEGORY_LABEL.TAXONOMIC_LEVEL_DOMAIN,
  id: GA2_CATEGORY_KEY.TAXONOMIC_LEVEL_DOMAIN,
  width: { max: "1fr", min: "200px" },
};

export const TAXONOMIC_LEVEL_KINGDOM: ColumnConfig<GA2AssemblyEntity> = {
  componentConfig: {
    component: BasicCell,
    viewBuilder: buildTaxonomicLevelKingdom,
  } as ComponentConfig<typeof BasicCell, GA2AssemblyEntity>,
  header: GA2_CATEGORY_LABEL.TAXONOMIC_LEVEL_KINGDOM,
  id: GA2_CATEGORY_KEY.TAXONOMIC_LEVEL_KINGDOM,
  width: { max: "1fr", min: "200px" },
};

export const TAXONOMIC_LEVEL_PHYLUM: ColumnConfig<GA2AssemblyEntity> = {
  componentConfig: {
    component: BasicCell,
    viewBuilder: buildTaxonomicLevelPhylum,
  } as ComponentConfig<typeof BasicCell, GA2AssemblyEntity>,
  header: GA2_CATEGORY_LABEL.TAXONOMIC_LEVEL_PHYLUM,
  id: GA2_CATEGORY_KEY.TAXONOMIC_LEVEL_PHYLUM,
  width: { max: "1fr", min: "200px" },
};

export const TAXONOMIC_LEVEL_CLASS: ColumnConfig<GA2AssemblyEntity> = {
  componentConfig: {
    component: BasicCell,
    viewBuilder: buildTaxonomicLevelClass,
  } as ComponentConfig<typeof BasicCell, GA2AssemblyEntity>,
  header: GA2_CATEGORY_LABEL.TAXONOMIC_LEVEL_CLASS,
  id: GA2_CATEGORY_KEY.TAXONOMIC_LEVEL_CLASS,
  width: { max: "1fr", min: "200px" },
};

export const TAXONOMIC_LEVEL_ORDER: ColumnConfig<GA2AssemblyEntity> = {
  componentConfig: {
    component: BasicCell,
    viewBuilder: buildTaxonomicLevelOrder,
  } as ComponentConfig<typeof BasicCell, GA2AssemblyEntity>,
  header: GA2_CATEGORY_LABEL.TAXONOMIC_LEVEL_ORDER,
  id: GA2_CATEGORY_KEY.TAXONOMIC_LEVEL_ORDER,
  width: { max: "1fr", min: "200px" },
};

export const TAXONOMIC_LEVEL_FAMILY: ColumnConfig<GA2AssemblyEntity> = {
  componentConfig: {
    component: BasicCell,
    viewBuilder: buildTaxonomicLevelFamily,
  } as ComponentConfig<typeof BasicCell, GA2AssemblyEntity>,
  header: GA2_CATEGORY_LABEL.TAXONOMIC_LEVEL_FAMILY,
  id: GA2_CATEGORY_KEY.TAXONOMIC_LEVEL_FAMILY,
  width: { max: "1fr", min: "200px" },
};

export const TAXONOMIC_LEVEL_GENUS: ColumnConfig<GA2AssemblyEntity> = {
  componentConfig: {
    component: BasicCell,
    viewBuilder: buildTaxonomicLevelGenus,
  } as ComponentConfig<typeof BasicCell, GA2AssemblyEntity>,
  header: GA2_CATEGORY_LABEL.TAXONOMIC_LEVEL_GENUS,
  id: GA2_CATEGORY_KEY.TAXONOMIC_LEVEL_GENUS,
  width: { max: "1fr", min: "200px" },
};

export const TAXONOMIC_GROUP: ColumnConfig<GA2AssemblyEntity> = {
  componentConfig: {
    component: NTagCell,
    viewBuilder: buildAssemblyTaxonomicGroup,
  } as ComponentConfig<typeof NTagCell, GA2AssemblyEntity>,
  enableHiding: false,
  header: GA2_CATEGORY_LABEL.TAXONOMIC_GROUP,
  id: GA2_CATEGORY_KEY.TAXONOMIC_GROUP,
  width: { max: "0.5fr", min: "142px" },
};

export const TAXONOMIC_LEVEL_SPECIES: ColumnConfig<GA2AssemblyEntity> = {
  columnPinned: true,
  componentConfig: {
    component: SpeciesCell,
    viewBuilder: V.buildAssemblySpecies,
  } as ComponentConfig<typeof SpeciesCell, GA2AssemblyEntity>,
  header: GA2_CATEGORY_LABEL.TAXONOMIC_LEVEL_SPECIES,
  id: GA2_CATEGORY_KEY.TAXONOMIC_LEVEL_SPECIES,
  width: { max: "1.5fr", min: "340px" },
};

export const TAXONOMIC_LEVEL_STRAIN: ColumnConfig<GA2AssemblyEntity> = {
  componentConfig: {
    component: BasicCell,
    viewBuilder: buildGenomeTaxonomicLevelStrain,
  } as ComponentConfig<typeof BasicCell, GA2AssemblyEntity>,
  enableHiding: false,
  header: GA2_CATEGORY_LABEL.TAXONOMIC_LEVEL_STRAIN,
  id: GA2_CATEGORY_KEY.TAXONOMIC_LEVEL_STRAIN,
  width: { max: "0.5fr", min: "160px" },
};

export const TAXONOMY_ID: ColumnConfig<GA2AssemblyEntity> = {
  componentConfig: {
    component: BasicCell,
    viewBuilder: buildTaxonomyId,
  } as ComponentConfig<typeof BasicCell, GA2AssemblyEntity>,
  enableHiding: false,
  header: GA2_CATEGORY_LABEL.TAXONOMY_ID,
  id: GA2_CATEGORY_KEY.TAXONOMY_ID,
  width: { max: "0.5fr", min: "144px" },
};

export const ORGANISM_IMAGE: ColumnConfig<GA2AssemblyEntity> = {
  componentConfig: {
    component: OrganismAvatar,
    viewBuilder: V.buildOrganismImageThumbnail,
  } as ComponentConfig<typeof OrganismAvatar, GA2AssemblyEntity>,
  enableHiding: false,
  enableSorting: false,
  header: GA2_CATEGORY_LABEL.ORGANISM_AVATAR,
  id: GA2_CATEGORY_KEY.ORGANISM_AVATAR,
  width: "auto",
};
