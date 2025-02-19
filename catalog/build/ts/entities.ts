import { SOURCE_GENOME_KEYS } from "./constants";

export type SourceGenome = Record<(typeof SOURCE_GENOME_KEYS)[number], string>;
