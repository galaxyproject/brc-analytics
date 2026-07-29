import type { Pangenome } from "@/apis/catalog/brc-analytics-catalog/common/pangenome";
import { API as BRC_API } from "@/services/workflows/brc/routes";
import { formatTrsId } from "@/views/AnalyzeWorkflowsView/components/Main/utils";
import { CUSTOM_WORKFLOW } from "@/views/AnalyzeWorkflowsView/custom/constants";
import { DIFFERENTIAL_EXPRESSION_ANALYSIS } from "@/views/AnalyzeWorkflowsView/differentialExpressionAnalysis/constants";
import { LEXICMAP } from "@/views/AnalyzeWorkflowsView/lexicmap/constants";
import { LOGAN_SEARCH } from "@/views/AnalyzeWorkflowsView/loganSearch/constants";
import type { Workflow, WorkflowCategory } from "@repo/shared/apis/workflow";
import { fetchEntities } from "@repo/shared/services/workflows/loader";
import { API } from "@repo/shared/services/workflows/routes";
import {
  getEntitiesById,
  setEntitiesById,
  setEntitiesByType,
} from "@repo/shared/services/workflows/store";

/**
 * Loads the pangenomes store from the API, keyed by species taxonomy ID.
 * Pangenome data is optional (may be absent before its build lands), so a
 * missing or failed fetch is skipped rather than fatal.
 */
export async function loadPangenomes(): Promise<void> {
  if (getEntitiesById().has("pangenomes")) return;

  let pangenomes: Pangenome[];
  try {
    pangenomes = (await fetchEntities(BRC_API.pangenomes)) as Pangenome[];
  } catch (error) {
    // Optional data: stay non-fatal, but surface the error so a real
    // regression (vs. an intentionally-absent file) is debuggable.
    console.warn("Failed to load pangenomes; skipping.", error);
    return;
  }

  // Optional data: a malformed (non-array) 200 payload must not throw and gate
  // the core entity load.
  if (!Array.isArray(pangenomes)) return;

  const pangenomeBySpeciesTaxonomyId = new Map<string, Pangenome>();
  for (const pangenome of pangenomes) {
    pangenomeBySpeciesTaxonomyId.set(pangenome.speciesTaxonomyId, pangenome);
  }

  setEntitiesById("pangenomes", pangenomeBySpeciesTaxonomyId);
  setEntitiesByType("pangenomes", pangenomes);
}

/**
 * Loads the workflows store with workflows from the API.
 */
export async function loadWorkflows(): Promise<void> {
  if (getEntitiesById().has("workflows")) return;

  const workflowCategories = (await fetchEntities(
    API.workflows
  )) as WorkflowCategory[];

  const workflows = workflowCategories.flatMap((w) => w.workflows);

  const workflowById = new Map<string, Workflow>();

  for (const workflow of workflows) {
    workflowById.set(formatTrsId(workflow.trsId), workflow);
  }

  // Add custom workflow.
  workflowById.set(CUSTOM_WORKFLOW.trsId, CUSTOM_WORKFLOW);

  // Add differential expression analysis.
  workflowById.set(
    DIFFERENTIAL_EXPRESSION_ANALYSIS.trsId,
    DIFFERENTIAL_EXPRESSION_ANALYSIS
  );

  // Add LMLS workflows (Logan Search and Lexicmap).
  workflowById.set(LOGAN_SEARCH.trsId, LOGAN_SEARCH);
  workflowById.set(LEXICMAP.trsId, LEXICMAP);

  setEntitiesById("workflows", workflowById);
  setEntitiesByType("workflows", workflowCategories);
}
