import pandas as pd
import requests
import urllib.parse
import re
import yaml

ASSEMBLIES_PATH = "catalog-build/source/assemblies.yml"

UCSC_ASSEMBLIES_URL = "https://hgdownload.soe.ucsc.edu/hubs/BRC/assemblyList.json"

GENOMES_OUTPUT_PATH = "catalog-build/source/genomes-from-ncbi.tsv"

ORGANISM_GROUPS_BY_TAXONOMY_ID = {
  2: "Bacterium",
  10239: "Virus",
  4751: "Fungus",
  50557: "Insect",
  5794: "Apicomplexan",
  5653: "Kinetoplastid",
}

def read_assemblies():
  with open(ASSEMBLIES_PATH) as stream:
    return pd.DataFrame(yaml.safe_load(stream)["assemblies"])

def get_paginated_ncbi_results(base_url, query_description):
  page = 1
  next_page_token = None
  results = []
  while next_page_token or page == 1:
    print(f"Requesting page {page} of {query_description}")
    request_url = f"{base_url}?page_size=1000{"&page_token=" + next_page_token if next_page_token else ""}"
    page_data = requests.get(request_url).json()
    if len(page_data["reports"][0].get("errors", [])) > 0:
      raise Exception(page_data["reports"][0])
    results += page_data["reports"]
    next_page_token = page_data.get("next_page_token")
    page += 1
  return results

def get_organism_groups(lineage):
  return [ORGANISM_GROUPS_BY_TAXONOMY_ID[tax_id] for tax_id in lineage if tax_id in ORGANISM_GROUPS_BY_TAXONOMY_ID]

def get_species_row(taxon_info):
  species_info = taxon_info["taxonomy"]["classification"]["species"]
  return {
    "taxonomyId": taxon_info["taxonomy"]["tax_id"],
    "species": species_info["name"],
    "speciesTaxonomyId": species_info["id"],
    "organismGroup": ",".join(get_organism_groups(taxon_info["taxonomy"]["parents"]))
  }

def get_species_df(taxonomy_ids):
  species_info = get_paginated_ncbi_results(f"https://api.ncbi.nlm.nih.gov/datasets/v2/taxonomy/taxon/{",".join([str(id) for id in taxonomy_ids])}/dataset_report", "taxa")
  return pd.DataFrame([get_species_row(info) for info in species_info])

def get_genome_row(genome_info):
  refseq_category = genome_info["assembly_info"].get("refseq_category")
  return {
    "strain": genome_info["organism"].get("infraspecific_names", {}).get("strain", ""),
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
    "pairedAccession": genome_info.get("paired_accession"),
  }

def get_genomes_df(accessions):
  genomes_info = get_paginated_ncbi_results(f"https://api.ncbi.nlm.nih.gov/datasets/v2/genome/accession/{",".join(accessions)}/dataset_report", "genomes")
  return pd.DataFrame(data=[get_genome_row(info) for info in genomes_info])

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

  source_list_df = read_assemblies()

  base_genomes_df = get_genomes_df(source_list_df["accession"])

  species_df = get_species_df(base_genomes_df["taxonomyId"])

  genomes_with_species_df = base_genomes_df.merge(species_df, how="left", on="taxonomyId")

  assemblies_df = pd.DataFrame(requests.get(UCSC_ASSEMBLIES_URL).json()["data"])[["ucscBrowser", "genBank", "refSeq"]]

  gen_bank_merge_df = genomes_with_species_df.merge(assemblies_df, how="left", left_on="accession", right_on="genBank")
  ref_seq_merge_df = genomes_with_species_df.merge(assemblies_df, how="left", left_on="accession", right_on="refSeq")

  unmatched_accessions = genomes_with_species_df["accession"][~(genomes_with_species_df["accession"].isin(assemblies_df["genBank"]) | genomes_with_species_df["accession"].isin(assemblies_df["refSeq"]))]
  if len(unmatched_accessions) > 0:
    print(f"{len(unmatched_accessions)} accessions had no match in assembly list: {", ".join(unmatched_accessions)}")

  genomes_df = add_gene_model_url(gen_bank_merge_df.combine_first(ref_seq_merge_df))

  genomes_df.to_csv(GENOMES_OUTPUT_PATH, index=False, sep="\t")

  print(f"Wrote to {GENOMES_OUTPUT_PATH}")

if __name__ == "__main__":
  build_files()
