import fsp from "fs/promises";
import { buildAssemblies } from "./build-assemblies";
import { buildOrganisms } from "./build-organisms";
import { buildOutbreaks } from "./build-outbreaks";
import {
  buildWorkflowAssemblyMappings,
  generateWorkflowMappingsQC,
} from "./build-workflow-mappings";
import { buildWorkflows } from "./build-workflows";
import { saveJson } from "./utils";

buildCatalog().catch(console.error);

async function buildCatalog(): Promise<void> {
  try {
    const outbreaks = await buildOutbreaks();
    const outbreaksByTaxonomyId = new Map(
      outbreaks.map((outbreak) => [outbreak.taxonomy_id, outbreak])
    );

    const genomes = await buildAssemblies(outbreaksByTaxonomyId);
    const organisms = buildOrganisms(genomes);
    const workflows = await buildWorkflows();

    console.log("Assemblies:", genomes.length);
    await saveJson("catalog/output/assemblies.json", genomes);

    console.log("Organisms:", organisms.length);
    await saveJson("catalog/output/organisms.json", organisms);

    console.log("Outbreaks:", outbreaks.length);
    await saveJson("catalog/output/outbreaks.json", outbreaks);

    console.log("Workflows:", workflows.length);
    await saveJson("catalog/output/workflows.json", workflows);

    // Compute and save workflow-assembly mappings
    const mappings = buildWorkflowAssemblyMappings(workflows, genomes);
    console.log("Workflow-Assembly Mappings:", Object.keys(mappings).length);
    await saveJson("catalog/output/workflow-assembly-mappings.json", mappings);

    // Generate workflow mappings QC report (pass "BRC" as site name)
    const qcReport = generateWorkflowMappingsQC(mappings, workflows, "BRC");
    await fsp.writeFile("catalog/output/qc-report.workflow-mappings.md", qcReport);
  } catch (error) {
    console.error("Build failed:", error);
    process.exit(1);
  }
}
