import { ConfiguredInput } from "../../../../../../../../../../../../views/WorkflowInputsView/hooks/UseConfigureInputs/types";
import { CONFIGURED_VALUE_KEYS } from "./constants";
import { ConfiguredValue } from "./types";
import { isStringArray } from "./typeGuards";

/**
 * Returns the configured values for a given entry key.
 * @param key - Entry key.
 * @param configuredInput - Configured input.
 * @returns Configured values, or undefined.
 */
export function getConfiguredValue(
  key: keyof ConfiguredValue,
  configuredInput: ConfiguredInput
): (string | null)[] | undefined {
  return configuredInput[key]?.values?.map((value) => value.key);
}

/**
 * Returns the configured values from the configured input.
 * @param configuredInput - Configured input.
 * @returns Configured values.
 */
export function getConfiguredValues(
  configuredInput: ConfiguredInput
): ConfiguredValue | undefined {
  const configuredValue = {} as ConfiguredValue;
  for (const key of CONFIGURED_VALUE_KEYS) {
    const values = getConfiguredValue(key, configuredInput);
    if (key === "geneModelUrl" || key === "referenceAssembly") {
      const value = parseValue(key, values);
      if (!value) return;
      configuredValue[key] = value;
      continue;
    }
    if (key === "readRuns") {
      const value = parseValue(key, values);
      if (!value) return;
      configuredValue[key] = value;
    }
  }
  return configuredValue;
}

/**
 * Returns the value for the given key.
 * @param key - Key of the configured value.
 * @param values - Values for the configured value.
 * @returns Value for the given key, or undefined.
 */
function parseValue<K extends keyof ConfiguredValue>(
  key: K,
  values: (string | null)[] | undefined
): ConfiguredValue[K] | undefined {
  switch (key) {
    case "geneModelUrl":
    case "referenceAssembly": {
      // Expecting gene model URL and reference assembly to be a string.
      const value = values?.[0];
      if (typeof value !== "string") return;
      return value as ConfiguredValue[K]; // Type assertion is safe here because we know these keys expect a string.
    }
    case "readRuns": {
      // Expecting read runs to be string array.
      if (!isStringArray(values)) return;
      return values as ConfiguredValue[K]; // Type assertion is safe here because we know this key expects a string array.
    }
    default:
      return undefined;
  }
}
