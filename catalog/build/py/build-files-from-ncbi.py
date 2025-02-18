from package.catalog_build import build_files

ASSEMBLIES_PATH = "catalog/source/assemblies.yml"

UCSC_ASSEMBLIES_URL = "https://hgdownload.soe.ucsc.edu/hubs/BRC/assemblyList.json"

GENOMES_OUTPUT_PATH = "catalog/build/intermediate/genomes-from-ncbi.tsv"

TREE_OUTPUT_PATH = "catalog/output/ncbi-taxa-tree.json"

TAXONOMIC_GROUPS_BY_TAXONOMY_ID = {
  2: "Bacteria",
  10239: "Viruses",
  4751: "Fungi",
  50557: "Insecta",
  5794: "Apicomplexa",
  5653: "Kinetoplastea",
}

TAXANOMIC_LEVELS_FOR_TREE = [
  "superkingdom", 
  "kingdom", 
  "phylum", 
  "class", 
  "order", 
  "family", 
  "genus", 
  "species",
  "strain"
]

if __name__ == "__main__":
  build_files(
    ASSEMBLIES_PATH,
    GENOMES_OUTPUT_PATH,
    UCSC_ASSEMBLIES_URL,
    TAXANOMIC_LEVELS_FOR_TREE,
    {"taxonomicGroup": TAXONOMIC_GROUPS_BY_TAXONOMY_ID}
  )
