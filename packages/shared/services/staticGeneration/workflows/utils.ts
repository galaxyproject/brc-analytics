import type { WorkflowCategory } from "@repo/shared/apis/workflow";
import { promises as fsp } from "fs";

const categoriesByFile = new Map<string, Promise<WorkflowCategory[]>>();

/**
 * Reads the workflow categories from the given catalog file — the same source
 * the runtime workflows store fetches — memoized per build worker so per-page
 * static props don't re-read the file for every generated page.
 * @param staticLoadFile - Repo-root-relative path to the workflows catalog file.
 * @returns Workflow categories.
 */
export function loadWorkflowCategories(
  staticLoadFile: string
): Promise<WorkflowCategory[]> {
  let promise = categoriesByFile.get(staticLoadFile);
  if (!promise) {
    promise = fsp
      .readFile(staticLoadFile, "utf8")
      .then((text) => JSON.parse(text) as WorkflowCategory[]);
    categoriesByFile.set(staticLoadFile, promise);
  }
  return promise;
}
