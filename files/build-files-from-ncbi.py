import pandas as pd
import requests
import urllib.parse
import re

TAXA_URL = "https://docs.google.com/spreadsheets/d/1Gg9sw2Qw765tOx2To53XkTAn-RAMiBtqYrfItlLXXrc/gviz/tq?tqx=out:csv&sheet=Sheet1.csv"

TAXONOMY_URL = "https://api.ncbi.nlm.nih.gov/datasets/v2/taxonomy/dataset_report"

ASSEMBLIES_URL = "https://hgdownload.soe.ucsc.edu/hubs/BRC/assemblyList.json"

ORGANISMS_OUTPUT_PATH = "files/source/organisms-from-ncbi.tsv"
GENOMES_OUTPUT_PATH = "files/source/genomes-from-ncbi.tsv"

def build_taxonomy_request_body(taxa):
  return {"taxons": taxa, "children": False, "ranks": ["genus"]}

def get_organism_row(organism_info):
  if len(organism_info.get("errors", [])) > 0:
    raise Exception(organism_info)

  organism_taxonomy = organism_info["taxonomy"]

  return {
    "taxon": organism_taxonomy["current_scientific_name"]["name"],
    "taxonomyId": str(organism_taxonomy["tax_id"]),
    "assemblyCount": next(count["count"] for count in organism_taxonomy["counts"] if count["type"] == "COUNT_TYPE_ASSEMBLY"),
  }

def get_organisms_df(taxa):
  organisms_info = requests.post(TAXONOMY_URL, json=build_taxonomy_request_body(taxa)).json()["reports"]
  return pd.DataFrame([get_organism_row(organism_info) for organism_info in organisms_info])

def get_tax_ids(organisms_df):
  return list(organisms_df["taxonomyId"])

def build_genomes_url(tax_ids):
  return f"https://api.ncbi.nlm.nih.gov/datasets/v2/genome/taxon/{urllib.parse.quote(",".join([str(id) for id in tax_ids]))}/dataset_report?filters.assembly_source=refseq&filters.has_annotation=true&filters.exclude_paired_reports=true&filters.exclude_atypical=true&filters.assembly_level=scaffold&filters.assembly_level=chromosome&filters.assembly_level=complete_genome"

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

def _id_to_gene_model_url(asm_id):
  hubs_url = "https://hgdownload.soe.ucsc.edu/hubs/"
  components = [asm_id[0:3], asm_id[4:7], asm_id[7:10], asm_id[10:13], asm_id, "genes"]
  url = urllib.parse.urljoin(hubs_url, "/".join(components))
  # url looks something like https://hgdownload.soe.ucsc.edu/hubs/GCF/030/504/385/GCF_030504385.1/genes/
  # and contains html content with links to gene models.
  # we need to scrape this to get the gtf
  print(f"fetching url {url}")
  response = requests.get(url)
  try:
    response.raise_for_status()
  except Exception:
    # FIXME?: Some accessions don't have a gene folder
    return None
  # find link to gtf, should ideally be ncbiRefSeq, but augustus will do
  html_content = response.text
  pattern = rf"{asm_id.replace('.', r'\.')}.*?\.gtf\.gz"
  augustus_file = None
  for match in re.findall(pattern, html_content):
    if "ncbiRefSeq" in match:
      return urllib.parse.urljoin(f"{url}/", match)
    elif "augustus" in match:
      augustus_file = match
  if augustus_file:
    return urllib.parse.urljoin(f"{url}/", augustus_file)
  # No match, I guess that's OK ?
  return None

def add_gene_model_url(genomes_df: pd.DataFrame):
  return pd.concat([genomes_df, genomes_df["accession"].apply(_id_to_gene_model_url).rename("geneModelUrl")], axis="columns")

def build_files():
  print("Building files")

  taxa_df = pd.read_csv(TAXA_URL, keep_default_na=False)

  organisms_source_df = get_organisms_df([taxon for taxon in taxa_df["Name"] if taxon])

  organisms_df = organisms_source_df.merge(taxa_df[["TaxId", "CustomTags"]], how="left", left_on="taxonomyId", right_on="TaxId").drop(columns=["TaxId"])

  organisms_df.to_csv(ORGANISMS_OUTPUT_PATH, index=False, sep="\t")

  print(f"Wrote to {ORGANISMS_OUTPUT_PATH}")

  genomes_source_df = get_genomes_df(get_tax_ids(organisms_df))
  assemblies_df = pd.DataFrame(requests.get(ASSEMBLIES_URL).json()["data"])[["ucscBrowser", "genBank", "refSeq"]]

  gen_bank_merge_df = genomes_source_df.merge(assemblies_df, how="left", left_on="accession", right_on="genBank")
  ref_seq_merge_df = genomes_source_df.merge(assemblies_df, how="left", left_on="accession", right_on="refSeq")

  unmatched_accessions = genomes_source_df["accession"][~(genomes_source_df["accession"].isin(assemblies_df["genBank"]) | genomes_source_df["accession"].isin(assemblies_df["refSeq"]))]
  if len(unmatched_accessions) > 0:
    print(f"{len(unmatched_accessions)} accessions had no match in assembly list: {", ".join(unmatched_accessions)}")

  genomes_df = add_gene_model_url(gen_bank_merge_df.combine_first(ref_seq_merge_df))

  genomes_df.to_csv(GENOMES_OUTPUT_PATH, index=False, sep="\t")

  print(f"Wrote to {GENOMES_OUTPUT_PATH}")

if __name__ == "__main__":
  build_files()
