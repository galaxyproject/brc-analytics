import { Breadcrumb } from "@databiosphere/findable-ui/lib/components/common/Breadcrumbs/breadcrumbs";
import { CardProps } from "@databiosphere/findable-ui/lib/components/common/Card/card";
import {
  Key,
  Value,
} from "@databiosphere/findable-ui/lib/components/common/KeyValuePairs/keyValuePairs";
import { ViewContext } from "@databiosphere/findable-ui/lib/config/entities";
import { ComponentProps } from "react";
import { ROUTES } from "../../../../../routes/constants";
import { BRCDataCatalogGenome } from "../../../../apis/catalog/brc-analytics-catalog/common/entities";
import * as C from "../../../../components";
import { GENOME_BROWSER } from "./constants";

/**
 * Build props for the genome analysis cell.
 * @param genome - Genome entity.
 * @param viewContext - View context.
 * @returns Props to be used for the AnalyzeGenome component.
 */
export const buildAnalyzeGenome = (
  genome: BRCDataCatalogGenome,
  viewContext: ViewContext<BRCDataCatalogGenome>
): ComponentProps<typeof C.AnalyzeGenome> => {
  const { cellContext } = viewContext;
  const { row } = cellContext || {};
  return {
    genomeVersionAssemblyId: genome.genomeVersionAssemblyId,
    rowId: row?.id,
    ucscBrowserUrl: genome.ucscBrowserUrl,
  };
};

/**
 * Build props for the chromosomes cell.
 * @param genome - Genome entity.
 * @returns Props to be used for the cell.
 */
export const buildChromosomes = (
  genome: BRCDataCatalogGenome
): ComponentProps<typeof C.BasicCell> => {
  return {
    value: genome.chromosomes,
  };
};

/**
 * Build props for the contigs cell.
 * @param genome - Genome entity.
 * @returns Props to be used for the cell.
 */
export const buildContigs = (
  genome: BRCDataCatalogGenome
): ComponentProps<typeof C.BasicCell> => {
  return {
    value: genome.contigs,
  };
};

/**
 * Build props for the genome AnalysisMethod component.
 * @param genome - Genome entity.
 * @param cardProps - Card properties.
 * @param cardProps.text - Card text.
 * @param cardProps.title - Card title.
 * @param cardProps.url - Card url.
 * @returns Props to be used for the AnalysisMethod component.
 */
export const buildGenomeAnalysisMethod = (
  genome: BRCDataCatalogGenome,
  { text, title, url }: Partial<CardProps> & { url: string }
): ComponentProps<typeof C.AnalysisMethod> => {
  return {
    text,
    title,
    url,
  };
};

/**
 * Build props for the genome AnalysisPortals component.
 * @param genome - Genome entity.
 * @returns Props to be used for the AnalysisPortals component.
 */
export const buildGenomeAnalysisPortals = (
  genome: BRCDataCatalogGenome
): ComponentProps<typeof C.AnalysisPortals> => {
  return {
    portals: [
      {
        imageProps: {
          alt: GENOME_BROWSER,
          src: "/analysis-portals/ucsc-genome.png",
          width: 20,
        },
        label: GENOME_BROWSER,
        url: genome.ucscBrowserUrl,
      },
    ],
  };
};

/**
 * Build props for the genome DetailViewHero component.
 * @param genome - Genome entity.
 * @returns Props to be used for the DetailViewHero component.
 */
export const buildGenomeChooseAnalysisMethodDetailViewHero = (
  genome: BRCDataCatalogGenome
): ComponentProps<typeof C.DetailViewHero> => {
  return {
    breadcrumbs: C.Breadcrumbs({
      breadcrumbs: getGenomeEntityChooseAnalysisMethodBreadcrumbs(genome),
    }),
    title: "Choose Analysis Methods",
  };
};

/**
 * Build props for the genome detail KeyValuePairs component.
 * @param genome - Genome entity.
 * @returns Props to be used for the KeyValuePairs component.
 */
export const buildGenomeDetails = (
  genome: BRCDataCatalogGenome
): ComponentProps<typeof C.KeyValuePairs> => {
  const keyValuePairs = new Map<Key, Value>();
  keyValuePairs.set(
    "Species",
    C.Link({
      label: genome.species,
      url: `https://www.ncbi.nlm.nih.gov/datasets/taxonomy/${encodeURIComponent(
        genome.ncbiTaxonomyId
      )}/`,
    })
  );
  keyValuePairs.set("Strain", genome.strain);
  keyValuePairs.set("Assembly Version ID", genome.genomeVersionAssemblyId);
  keyValuePairs.set("VeUPathDB Project", genome.vEuPathDbProject);
  keyValuePairs.set("Contigs", genome.contigs);
  keyValuePairs.set("Super Contigs", genome.supercontigs);
  keyValuePairs.set("Chromosomes", genome.chromosomes);
  return {
    KeyElType: C.KeyElType,
    KeyValuesElType: (props) => C.Stack({ gap: 4, ...props }),
    ValueElType: C.ValueElType,
    keyValuePairs,
  };
};

/**
 * Build props for the genome version/assembly ID cell.
 * @param genome - Genome entity.
 * @returns Props to be used for the cell.
 */
export const buildGenomeVersionAssemblyId = (
  genome: BRCDataCatalogGenome
): ComponentProps<typeof C.BasicCell> => {
  return {
    value: genome.genomeVersionAssemblyId,
  };
};

/**
 * Build props for the organism list hero.
 * @returns Props to be used for the FluidAlert component.
 */
export const buildOrganismListHero = (): ComponentProps<
  typeof C.FluidAlert
> => {
  return {
    children:
      "If you do not see your organism in this list: it will be there! We are in the process of ingesting sequences and annotations for all 785 taxa from VEuPathDb. The table below is generated by comparing the list maintained by VEuPathDB against official NCBI genome builds. The three buttons adjacent to each taxon direct you to a page listing available analytical workflows as well as direct links to genomic data (NCBI Datasets) and a genome browser (UCSC). A comprehensive search functionality will be developed to allow complex queries.",
    severity: "warning",
  };
};

/**
 * Build props for the species cell.
 * @param genome - Genome entity.
 * @returns Props to be used for the cell.
 */
export const buildSpecies = (
  genome: BRCDataCatalogGenome
): ComponentProps<typeof C.Link> => {
  return {
    label: genome.species,
    url: `https://www.ncbi.nlm.nih.gov/datasets/taxonomy/${encodeURIComponent(
      genome.ncbiTaxonomyId
    )}/`,
  };
};

/**
 * Build props for the strain cell.
 * @param genome - Genome entity.
 * @returns Props to be used for the cell.
 */
export const buildStrain = (
  genome: BRCDataCatalogGenome
): ComponentProps<typeof C.BasicCell> => {
  return {
    value: genome.strain,
  };
};

/**
 * Build props for the supercontigs cell.
 * @param genome - Genome entity.
 * @returns Props to be used for the cell.
 */
export const buildSupercontigs = (
  genome: BRCDataCatalogGenome
): ComponentProps<typeof C.BasicCell> => {
  return {
    value: genome.supercontigs,
  };
};

/**
 * Build props for the VEuPathDB project cell.
 * @param genome - Genome entity.
 * @returns Props to be used for the cell.
 */
export const buildVEuPathDbProject = (
  genome: BRCDataCatalogGenome
): ComponentProps<typeof C.BasicCell> => {
  return {
    value: genome.vEuPathDbProject,
  };
};

/**
 * Get the genome entity breadcrumbs.
 * @param genome - Genome entity.
 * @returns Breadcrumbs.
 */
function getGenomeEntityChooseAnalysisMethodBreadcrumbs(
  genome: BRCDataCatalogGenome
): Breadcrumb[] {
  return [
    { path: ROUTES.ORGANISMS, text: "Organisms" },
    { path: "", text: `${genome.species} - ${genome.strain}` },
    { path: "", text: "Choose Analysis Methods" },
  ];
}
