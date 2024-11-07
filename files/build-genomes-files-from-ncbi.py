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

OUTPUT_PATH = "files/source/genomes-from-ncbi.tsv"

def build_taxonomy_request_body(taxa):
  return {"taxons": taxa, "children": False, "ranks": ["genus"]}

def get_tax_ids(taxa):
  taxonomy_info = requests.post(TAXONOMY_URL, json=build_taxonomy_request_body(taxa)).json()
  return [organism_info["taxonomy"]["tax_id"] for organism_info in taxonomy_info["reports"]]

def build_genomes_url(tax_ids):
  return f"https://api.ncbi.nlm.nih.gov/datasets/v2/genome/taxon/{url_quote(",".join([str(id) for id in tax_ids]))}/dataset_report?filters.assembly_source=refseq&filters.has_annotation=true&filters.exclude_paired_reports=true&filters.exclude_atypical=true&filters.assembly_level=scaffold&filters.assembly_level=chromosome&filters.assembly_level=complete_genome"

def get_genome_row(genome_info):
  refseq_category = genome_info["assembly_info"].get("refseq_category")
  return {
    "taxon": genome_info["organism"]["organism_name"],
    "taxonomyId": genome_info["organism"]["tax_id"],
    "accession": genome_info["accession"],
    "isRef": (not (refseq_category is None)) and ("reference" in refseq_category),
    "level": genome_info["assembly_info"]["assembly_level"],
    "chromosomeCount": genome_info["assembly_stats"].get("total_number_of_chromosomes"),
    "length": genome_info["assembly_stats"]["total_sequence_length"],
    "scaffoldCount": genome_info["assembly_stats"]["number_of_scaffolds"],
    "scaffoldN50": genome_info["assembly_stats"]["scaffold_n50"],
    "scaffoldL50": genome_info["assembly_stats"]["scaffold_l50"],
    "coverage": genome_info["assembly_stats"].get("genome_coverage"),
    "gcPercent": genome_info["assembly_stats"]["gc_percent"],
    "annotationStatus": genome_info["annotation_info"].get("status"),
  }

def get_genomes_df(tax_ids):
  return pd.DataFrame(data=[get_genome_row(genome_info) for genome_info in requests.get(build_genomes_url(tax_ids)).json()["reports"]])

def build_genomes_files():
  print("Building files")

  df = get_genomes_df(get_tax_ids(TAXA))

  df.to_csv(OUTPUT_PATH, index=False, sep="\t")

  print(f"Wrote to {OUTPUT_PATH}")

if __name__ == "__main__":
  build_genomes_files()
