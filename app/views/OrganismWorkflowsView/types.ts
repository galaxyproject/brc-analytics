export interface Organism {
  genomes: OrganismGenome[];
  taxonomicLevelSpecies: string;
}

interface OrganismGenome {
  lineageTaxonomyIds: string[];
}

export interface Props {
  entityId: string;
}
