from urllib.parse import quote as url_quote
import pandas as pd
import requests

TAXONOMY_URL = "https://api.ncbi.nlm.nih.gov/datasets/v2/taxonomy/dataset_report"

TAXA = [
  "Plasmodium falciparum",
  "Plasmodium vivax",
  "Plasmodium yoelii",
  "Plasmodium vinckei",
  "Culex pipiens",
  "Anopheles gambiae",
  "Toxoplasma gondii",
  "Mycobacterium tuberculosis",
  "Coccidioides posadasii",
  "Coccidioides immitis"
]

ASSEMBLIES_URL = "https://hgdownload.soe.ucsc.edu/hubs/BRC/assemblyList.json"

ORGANISMS_OUTPUT_PATH = "files/source/organisms-from-ncbi.tsv"
GENOMES_OUTPUT_PATH = "files/source/genomes-from-ncbi.tsv"

def build_taxonomy_request_body(taxa):
  return {"taxons": taxa, "children": False, "ranks": ["genus"]}

def get_organism_row(organism_taxonomy):
  return {
    "taxon": organism_taxonomy["current_scientific_name"]["name"],
    "taxonomyId": organism_taxonomy["tax_id"],
    "assemblyCount": next(count["count"] for count in organism_taxonomy["counts"] if count["type"] == "COUNT_TYPE_ASSEMBLY"),
  }

def get_organisms_df(taxa):
  return pd.DataFrame([get_organism_row(organism_info["taxonomy"]) for organism_info in requests.post(TAXONOMY_URL, json=build_taxonomy_request_body(taxa)).json()["reports"]])

def get_tax_ids(organisms_df):
  return list(organisms_df["taxonomyId"])

def build_genomes_url(tax_ids):
  return f"https://api.ncbi.nlm.nih.gov/datasets/v2/genome/taxon/{url_quote(",".join([str(id) for id in tax_ids]))}/dataset_report?filters.assembly_source=refseq&filters.has_annotation=true&filters.exclude_paired_reports=true&filters.exclude_atypical=true&filters.assembly_level=scaffold&filters.assembly_level=chromosome&filters.assembly_level=complete_genome"

def get_genome_row(genome_info):
  refseq_category = genome_info["assembly_info"].get("refseq_category")
  return {
    "taxon": genome_info["organism"]["organism_name"],
    "taxonomyId": genome_info["organism"]["tax_id"],
    "accession": genome_info["accession"],
    "isRef": refseq_category == "reference genome",
    "level": genome_info["assembly_info"]["assembly_level"],
    "chromosomeCount": genome_info["assembly_stats"].get("total_number_of_chromosomes"),
    "length": genome_info["assembly_stats"]["total_sequence_length"],
    "scaffoldCount": genome_info["assembly_stats"]["number_of_scaffolds"],
    "scaffoldN50": genome_info["assembly_stats"]["scaffold_n50"],
    "scaffoldL50": genome_info["assembly_stats"]["scaffold_l50"],
    "coverage": genome_info["assembly_stats"].get("genome_coverage"),
    "gcPercent": genome_info["assembly_stats"]["gc_percent"],
    "annotationStatus": genome_info["annotation_info"].get("status"),
    "pairedAccession": genome_info["paired_accession"],
  }

def get_genomes_df(tax_ids):
  return pd.DataFrame(data=[get_genome_row(genome_info) for genome_info in requests.get(build_genomes_url(tax_ids)).json()["reports"]])

def build_files():
  print("Building files")

  organisms_df = get_organisms_df(TAXA)

  organisms_df.to_csv(ORGANISMS_OUTPUT_PATH, index=False, sep="\t")

  print(f"Wrote to {ORGANISMS_OUTPUT_PATH}")

  genomes_source_df = get_genomes_df(get_tax_ids(organisms_df))
  assemblies_df = pd.DataFrame(requests.get(ASSEMBLIES_URL).json()["data"])[["ucscBrowser", "genBank", "refSeq"]]

  gen_bank_merge_df = genomes_source_df.merge(assemblies_df, how="left", left_on="pairedAccession", right_on="genBank")
  ref_seq_merge_df = genomes_source_df.merge(assemblies_df, how="left", left_on="accession", right_on="refSeq")

  result_df = gen_bank_merge_df.combine_first(ref_seq_merge_df)

  result_df.to_csv(GENOMES_OUTPUT_PATH, index=False, sep="\t")

  print(f"Wrote to {GENOMES_OUTPUT_PATH}")

if __name__ == "__main__":
  build_files()
