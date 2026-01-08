import json

import pandas as pd

from ....py_package.catalog_build import build_files, create_taxonomy_read_run_count

ASSEMBLIES_PATH = "catalog/ga2/source/assemblies.yml"

UCSC_ASSEMBLIES_URL = "https://hgdownload.soe.ucsc.edu/hubs/VGP/assemblyList.json"

GENOMES_OUTPUT_PATH = "catalog/ga2/build/intermediate/genomes-from-ncbi.tsv"

ORGANISM_IMAGE_PATH = "public/organism_image"

ORGANISM_IMAGE_INFO_PATH = "catalog/ga2/source/organism_image_data.json"

PRIMARYDATA_OUTPUT_PATH = "catalog/ga2/build/intermediate/primary-data-ncbi.tsv"

TREE_OUTPUT_PATH = "catalog/ga2/output/ncbi-taxa-tree.json"

TAXONOMY_READ_RUN_COUNTS_OUTPUT_PATH = (
    "catalog/ga2/build/intermediate/taxIdReadCount.json"
)

TAXONOMIC_GROUPS_BY_TAXONOMY_ID = {
    40674: "Mammalia",
    8782: "Aves",
    8459: "Testudines",
    8504: "Lepidosauria",
    1294634: "Crocodylia",
    8292: "Amphibia",
    7898: "Actinopterygii",
    7777: "Chondrichthyes",
    1476529: "Cyclostomata",
    7894: "Coelacanthiformes",
    7878: "Dipnomorpha",
    2682552: "Leptocardii",
    7712: "Tunicata",
    10219: "Hemichordata",
    7586: "Echinodermata",
    6447: "Mollusca",
    50557: "Insecta",
}

# TAXONOMIC_LEVELS_FOR_TREE should be listed in order, as the order is used in building the taxonomy tree;
# higher-level categories should be listed earlier than lower-level categories
TAXANOMIC_LEVELS_FOR_TREE = [
    "domain",
    "kingdom",
    "phylum",
    "class",
    "order",
    "family",
    "genus",
    "species",
    "strain",
]

TOLIDS_BY_TAXONOMY_ID = {
    40674: "m",  # Mammalia
    8782: "b",  # Aves
    32561: {  # Sauria
        "value": "r",
        "exclude": 8782,  # Aves
    },
    8292: "a",  # Amphibia
    7898: "f",  # Actinopterygii
    7777: "s",  # Chondrichthyes
    7711: {  # Chordata
        "value": "k",
        "exclude": [
            40674,
            32561,
            8292,
            7898,
            7777,
        ],  # Mammalia, Sauria, Amphibia, Actinopterygii, Chondricthyes
    },
    10219: "k",  # Hemichordata
    7586: "e",  # Echinodermata
    6447: "x",  # Mollusca
    50557: "i",  # Insecta
}


def build_ncbi_data():
    build_files(
        ASSEMBLIES_PATH,
        GENOMES_OUTPUT_PATH,
        UCSC_ASSEMBLIES_URL,
        TREE_OUTPUT_PATH,
        TAXANOMIC_LEVELS_FOR_TREE,
        {
            "taxonomicGroup": TAXONOMIC_GROUPS_BY_TAXONOMY_ID,
            "tolId": TOLIDS_BY_TAXONOMY_ID,
        },
        do_gene_model_urls=False,
        primary_output_path=PRIMARYDATA_OUTPUT_PATH,
        extract_primary_data=True,
        organism_image_path=ORGANISM_IMAGE_PATH,
        organism_image_source_information_path=ORGANISM_IMAGE_INFO_PATH,
    )
    create_taxonomy_read_run_count(
        GENOMES_OUTPUT_PATH, TAXONOMY_READ_RUN_COUNTS_OUTPUT_PATH
    )


if __name__ == "__main__":
    build_ncbi_data()
