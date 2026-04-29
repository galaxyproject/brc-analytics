import { LABEL } from "@databiosphere/findable-ui/lib/apis/azul/common/entities";
import { Assembly } from "./types";

/**
 * Returns the isolate value for an assembly, or LABEL.UNSPECIFIED if not available.
 * @param assembly - Assembly to get isolate from.
 * @returns The isolate value or LABEL.UNSPECIFIED.
 */
export function getAssemblyIsolate(assembly: Assembly): string {
  if ("taxonomicLevelIsolate" in assembly)
    return assembly.taxonomicLevelIsolate;
  return LABEL.UNSPECIFIED;
}

/**
 * Returns the serotype value for an assembly, or LABEL.UNSPECIFIED if not available.
 * @param assembly - Assembly to get serotype from.
 * @returns The serotype value or LABEL.UNSPECIFIED.
 */
export function getAssemblySerotype(assembly: Assembly): string {
  if ("taxonomicLevelSerotype" in assembly)
    return assembly.taxonomicLevelSerotype;
  return LABEL.UNSPECIFIED;
}
