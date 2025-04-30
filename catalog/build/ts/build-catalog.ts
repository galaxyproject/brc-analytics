import { buildAssemblies } from "./build-assemblies";
import { buildOrganisms } from "./build-organisms";
import { buildWorkflows } from "./build-workflows";
import { saveJson } from "./utils";

buildCatalog();

async function buildCatalog(): Promise<void> {
  const genomes = await buildAssemblies();
  const organisms = buildOrganisms(genomes);
  const workflows = await buildWorkflows();

  console.log("Assemblies:", genomes.length);
  await saveJson("catalog/output/assemblies.json", genomes);

  console.log("Organisms:", organisms.length);
  await saveJson("catalog/output/organisms.json", organisms);

  console.log("Workflows:", workflows.length);
  await saveJson("catalog/output/workflows.json", workflows);

  console.log("Done");
}
