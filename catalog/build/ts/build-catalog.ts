import { buildAssemblies } from "./build-assemblies";
import { buildOrganisms } from "./build-organisms";
import { buildOutbreaks } from "./build-outbreaks";
import { buildWorkflows } from "./build-workflows";
import { saveJson } from "./utils";

buildCatalog().catch(console.error);

async function buildCatalog(): Promise<void> {
  try {
    const genomes = await buildAssemblies();
    const organisms = buildOrganisms(genomes);
    const outbreaks = await buildOutbreaks();
    const workflows = await buildWorkflows();

    console.log("Assemblies:", genomes.length);
    await saveJson("catalog/output/assemblies.json", genomes);

    console.log("Organisms:", organisms.length);
    await saveJson("catalog/output/organisms.json", organisms);

    console.log("Outbreaks:", outbreaks.length);
    await saveJson("catalog/output/outbreaks.json", outbreaks);

    console.log("Workflows:", workflows.length);
    await saveJson("catalog/output/workflows.json", workflows);
  } catch (error) {
    console.error("Build failed:", error);
    process.exit(1);
  }
}
