from package.catalog_build import build_files

ASSEMBLIES_PATH = "catalog/source/assemblies.yml"

UCSC_ASSEMBLIES_URL = "https://hgdownload.soe.ucsc.edu/hubs/BRC/assemblyList.json"

GENOMES_OUTPUT_PATH = "catalog/build/intermediate/genomes-from-ncbi.tsv"

QC_REPORT_PATH = "catalog/output/qc-report.md"
TREE_OUTPUT_PATH = "catalog/output/ncbi-taxa-tree.json"

TAXONOMIC_GROUPS_BY_TAXONOMY_ID = {
  2: "Bacteria",
  10239: "Viruses",
  5794: "Apicomplexa",
  5653: "Kinetoplastea",
  6029: "Microsporidia",
  4762: "Oomycota",
  7742: "Vertebrata",
  554915: "Amoebozoa",
  2611341: "Metamonada",
  6656: "Arthropoda",
  4890: "Ascomycota",
  5204: "Basidiomycota",
  4761: "Chytridiomycota",
  1913637: "Mucoromycota"
}

TAXANOMIC_LEVELS_FOR_TREE = [
  "domain",
  "realm",
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
    TREE_OUTPUT_PATH,
    TAXANOMIC_LEVELS_FOR_TREE,
    {"taxonomicGroup": TAXONOMIC_GROUPS_BY_TAXONOMY_ID},
    qc_report_path=QC_REPORT_PATH
  )
