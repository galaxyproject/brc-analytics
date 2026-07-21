import { LABEL } from "@databiosphere/findable-ui/lib/apis/azul/common/entities";
import type { AssemblyContract } from "@repo/shared/apis/types";

/**
 * Returns the isolate value for an assembly, or LABEL.UNSPECIFIED if not available.
 * @param assembly - Assembly to get isolate from.
 * @returns The isolate value or LABEL.UNSPECIFIED.
 */
export function getAssemblyIsolate(assembly: AssemblyContract): string {
  return assembly.taxonomicLevelIsolate ?? LABEL.UNSPECIFIED;
}

/**
 * Returns the serotype value for an assembly, or LABEL.UNSPECIFIED if not available.
 * @param assembly - Assembly to get serotype from.
 * @returns The serotype value or LABEL.UNSPECIFIED.
 */
export function getAssemblySerotype(assembly: AssemblyContract): string {
  return assembly.taxonomicLevelSerotype ?? LABEL.UNSPECIFIED;
}
