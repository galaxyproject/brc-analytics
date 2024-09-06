import { Breadcrumb } from "@databiosphere/findable-ui/lib/components/common/Breadcrumbs/breadcrumbs";
import { CardProps } from "@databiosphere/findable-ui/lib/components/common/Card/card";
import {
  Key,
  Value,
} from "@databiosphere/findable-ui/lib/components/common/KeyValuePairs/keyValuePairs";
import { ComponentProps } from "react";
import { ROUTES } from "../../../../../routes/constants";
import { BRCDataCatalogGenome } from "../../../../apis/catalog/brc-analytics-catalog/common/entities";
import * as C from "../../../../components";
import { GENOME_BROWSER } from "./constants";

/**
 * Build props for the genome analysis cell.
 * @param genome - Genome entity.
 * @returns Props to be used for the AnalyzeGenome component.
 */
export const buildAnalyzeGenome = (
  genome: BRCDataCatalogGenome
): ComponentProps<typeof C.AnalyzeGenome> => {
  return {
    genome,
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
 * @returns Props to be used for the AnalysisMethod component.
 */
export const buildGenomeAnalysisMethod = (
  genome: BRCDataCatalogGenome,
  { text, title }: Partial<CardProps>
): ComponentProps<typeof C.AnalysisMethod> => {
  return {
    text,
    title,
    url: "",
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
          src: "/analysis-portals/ucsc-genome.svg",
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
  keyValuePairs.set("Species", genome.species);
  keyValuePairs.set("Strain", genome.strain);
  keyValuePairs.set("Genome Version", genome.genomeVersionAssemblyId);
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
 * Build props for the species cell.
 * @param genome - Genome entity.
 * @returns Props to be used for the cell.
 */
export const buildSpecies = (
  genome: BRCDataCatalogGenome
): ComponentProps<typeof C.BasicCell> => {
  return {
    value: genome.species,
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
    { path: ROUTES.GENOMES, text: "Genomes" },
    { path: "", text: `${genome.species} - ${genome.strain}` },
    { path: "", text: "Choose Analysis Methods" },
  ];
}