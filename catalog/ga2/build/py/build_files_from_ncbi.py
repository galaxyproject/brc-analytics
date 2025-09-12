from ....py_package.catalog_build import build_files

ASSEMBLIES_PATH = "catalog/ga2/source/assemblies.yml"

UCSC_ASSEMBLIES_URL = "https://hgdownload.soe.ucsc.edu/hubs/VGP/assemblyList.json"

GENOMES_OUTPUT_PATH = "catalog/ga2/build/intermediate/genomes-from-ncbi.tsv"

PRIMARYDATA_OUTPUT_PATH = "catalog/ga2/build/intermediate/primary-data-ncbi.tsv"

TREE_OUTPUT_PATH = "catalog/ga2/output/ncbi-taxa-tree.json"

VGP_BUCKET_DATA_PATH = "catalog/ga2/build/intermediate/vgp_bucket_raw_data.json"

VGP_BUCKET_DATA_FORMATED_PATH = "catalog/ga2/output/vgp_bucket_raw_data.json"

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

import pandas as pd
import json
import os
import re

def get_file_extension(file_url):
    if file_url['path'].endswith(".gz") or file_url['path'].endswith(".crai") or file_url['path'].endswith(".bai") or file_url['path'].endswith(".pbi"):
        return ".".join(file_url['path'].split(".")[-2:])
    return file_url['path'].split(".")[-1]

def combined_data(paths):
    data = {}
    for path in paths:
        extension = path['type'] #get_file_extension(path)
        file_name = os.path.basename(path['path']).rstrip(extension)
        file_part_name = re.split(r'_R\d_|_I\d_', file_name)[0]
        if file_part_name not in data:
            data[file_part_name] = {'index': None, 'indices': [], 'data': [], 'fileType': None}
        
        if "." in extension:
            data[file_part_name]['index'] = path['path']
        elif "_I" in file_name:
            data[file_part_name]['indices'].append(path['path'])
        else:
            data[file_part_name]['fileType'] = extension
            data[file_part_name]['data'].append(path['path'])
    return data

def raw_bucket_data_path(ucsc_data, vgp_bucket_data, output_path=None):
    data = []

    ucsc_data_df = pd.read_csv(ucsc_data, sep="\t", dtype=str)

    with open(vgp_bucket_data, "r") as f:
        vgp_bucket_data_dict = json.load(f)

    for individual in vgp_bucket_data_dict:
        speciesName = vgp_bucket_data_dict[individual]["common_name"].replace("_", " ").lower().capitalize()
        spieces_d = ucsc_data_df[ucsc_data_df['species'] == speciesName]
        taxonomyId = ""
        speciesTaxonomyId = ""
        accession = ""
        if spieces_d.empty:
            spieces_d = ucsc_data_df[ucsc_data_df['species'].str.startswith(speciesName)]
        if not spieces_d.empty:
            taxonomyId = spieces_d.iloc[0]['taxonomyId']
            speciesTaxonomyId = spieces_d.iloc[0]['speciesTaxonomyId']
            accession = spieces_d.iloc[0]['currentAccession']
            
        if 'genomic_data' in vgp_bucket_data_dict[individual]:
            for data_type in vgp_bucket_data_dict[individual]['genomic_data']:
                #file_extension = set([get_file_extension(file_url) for file_url in vgp_bucket_data_dict[species]['genomic_data'][data_type]])
                #if 'fastq' in file_extension or "fastq.gz" in file_extension:
#
 #                   
            #else:
            #    print(file_extension)
                combined = combined_data(vgp_bucket_data_dict[individual]['genomic_data'][data_type])
                for name in combined:
                    entry = {
                        "speciesName": speciesName, # Should change to speciesName instead of common name
                        "speciesTaxonomyId": speciesTaxonomyId,
                        "accession": accession,
                        "taxonomyId": taxonomyId, 
                        "dataType": data_type,
                        "fileName": name,
                        "individual": individual,
                        "fileType": combined[name]['fileType'],
                        "paired": len(combined[name]['data']) > 1,
                        "files": ",".join(combined[name]['data']),
                        "file_index": combined[name].get('index', ''),
                        "file_indices": ",".join(combined[name]['indices']),
                    }
                    data.append(entry)
    with open(output_path, 'w') as writer:
        json.dump(data, writer, indent=4)
    # return {
    #     "primary_data": primart_data,
    #     "vgp_bucket_data": vgp_bucket_data,
    # }

def build_ncbi_data():
    # build_files(
    #     ASSEMBLIES_PATH,
    #     GENOMES_OUTPUT_PATH,
    #     UCSC_ASSEMBLIES_URL,
    #     TREE_OUTPUT_PATH,
    #     TAXANOMIC_LEVELS_FOR_TREE,
    #     {
    #         "taxonomicGroup": TAXONOMIC_GROUPS_BY_TAXONOMY_ID,
    #         "tolId": TOLIDS_BY_TAXONOMY_ID,
    #     },
    #     do_gene_model_urls=False,
    #     primary_output_path=PRIMARYDATA_OUTPUT_PATH,
    #     extract_primary_data=True,
    # )
    raw_bucket_data_path(GENOMES_OUTPUT_PATH, VGP_BUCKET_DATA_PATH, VGP_BUCKET_DATA_FORMATED_PATH)


if __name__ == "__main__":
    build_ncbi_data()
