import { SOURCE_GENOME_KEYS, SOURCE_RAWDATA_KEYS } from "./constants";

export type SourceGenome = Record<(typeof SOURCE_GENOME_KEYS)[number], string>;

export type SourceRawData = Record<
  (typeof SOURCE_RAWDATA_KEYS)[number],
  string
>;
