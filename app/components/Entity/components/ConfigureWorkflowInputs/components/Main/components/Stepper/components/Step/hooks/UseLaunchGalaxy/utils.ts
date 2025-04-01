import { ConfiguredInput } from "../../../../../../../../../../../../views/WorkflowInputsView/hooks/UseConfigureInputs/types";
import { CONFIGURED_VALUE_KEYS } from "./constants";
import { ConfiguredValue } from "./types";
import {
  isValueString,
  isValueStringOrNull,
} from "../../../../../../../../../../../../utils/typeGuards";

/**
 * Returns the configured value for a given entry key.
 * Currently, only the first value is returned.
 * @param key - Entry key.
 * @param configuredInput - Configured input.
 * @returns Configured value, null, or undefined.
 */
export function getConfiguredValue(
  key: keyof ConfiguredValue,
  configuredInput: ConfiguredInput
): string | null | undefined {
  if (!configuredInput[key]) return;
  return configuredInput[key].values[0].key;
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
    const value = getConfiguredValue(key, configuredInput);
    // Configured values are incomplete; value is not a string or null.
    if (!isValueStringOrNull(value)) return;
    // Special case for reference assembly; value must be a string.
    if (key === "referenceAssembly") {
      if (!isValueString(value)) return;
      configuredValue[key] = value;
      continue;
    }
    configuredValue[key] = value;
  }
  return configuredValue;
}
