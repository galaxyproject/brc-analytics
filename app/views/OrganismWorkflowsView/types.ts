export interface Organism {
  assemblyCount: number;
  genomes: OrganismGenome[];
  ncbiTaxonomyId: string;
  taxonomicLevelSpecies: string;
}

interface OrganismGenome {
  lineageTaxonomyIds: string[];
}

export interface Props {
  entityId: string;
}
