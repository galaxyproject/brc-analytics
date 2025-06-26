import { buildAssemblies } from "./build-assemblies";
import { buildOrganisms } from "./build-organisms";
import { buildOutbreaks } from "./build-outbreaks";
import { buildWorkflows } from "./build-workflows";
import { saveJson } from "./utils";

buildCatalog();

async function buildCatalog(): Promise<void> {
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

  console.log("Done");
}
