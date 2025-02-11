from package.catalog_build import build_files

ASSEMBLIES_PATH = "catalog/source/assemblies.yml"

UCSC_ASSEMBLIES_URL = "https://hgdownload.soe.ucsc.edu/hubs/BRC/assemblyList.json"

GENOMES_OUTPUT_PATH = "catalog/build/intermediate/genomes-from-ncbi.tsv"

TAXONOMIC_GROUPS_BY_TAXONOMY_ID = {
  2: "Bacteria",
  10239: "Viruses",
  4751: "Fungi",
  50557: "Insecta",
  5794: "Apicomplexa",
  5653: "Kinetoplastea",
}

if __name__ == "__main__":
  build_files(ASSEMBLIES_PATH, GENOMES_OUTPUT_PATH, UCSC_ASSEMBLIES_URL, {"taxonomicGroup": TAXONOMIC_GROUPS_BY_TAXONOMY_ID})
