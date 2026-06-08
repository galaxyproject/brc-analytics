import { ConfiguredInput } from "./types";

/**
 * Empty configuration. Spread into an `onConfigure` call to wipe every field
 * other than the ones the caller explicitly sets — used when a step change
 * means "start over" (e.g. picking a different reference assembly).
 *
 * The mapped type forces every `ConfiguredInput` key to be present, so adding
 * a new field to the type surfaces a TS error here.
 */
export const DEFAULT_CONFIGURED_INPUT: {
  [K in keyof Required<ConfiguredInput>]: undefined;
} = {
  designFormula: undefined,
  geneModelUrl: undefined,
  numberOfHits: undefined,
  primaryContrasts: undefined,
  primaryFactor: undefined,
  readRunPairedFile: undefined,
  readRunSingleFile: undefined,
  readRunsPaired: undefined,
  readRunsSingle: undefined,
  referenceAssembly: undefined,
  sampleSheet: undefined,
  sampleSheetClassification: undefined,
  sequence: undefined,
  sequenceFileName: undefined,
  strandedness: undefined,
  tracks: undefined,
};
