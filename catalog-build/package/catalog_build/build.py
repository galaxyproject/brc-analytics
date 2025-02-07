import pandas as pd
import yaml
import requests
import urllib
import re

def read_assemblies(assemblies_path):
  with open(assemblies_path) as stream:
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

def match_taxonomic_group(tax_id, lineage, taxonomic_groups):
  if not tax_id in taxonomic_groups:
    return None
  taxon_info = taxonomic_groups[tax_id]
  name, exclude = (taxon_info["value"], taxon_info.get("exclude")) if isinstance(taxon_info, dict) else (taxon_info, None)
  if exclude is None:
    return name
  if isinstance(exclude, int):
    exclude = [exclude]
  if all(tid not in lineage for tid in exclude):
    return name
  return None

def get_taxonomic_groups(lineage, taxonomic_groups):
  return [group for group in (match_taxonomic_group(tax_id, lineage, taxonomic_groups) for tax_id in lineage) if group is not None]

def get_taxonomic_group_sets(lineage, taxonomic_group_sets):
  return {field: ",".join(get_taxonomic_groups(lineage, taxonomic_groups)) for field, taxonomic_groups in taxonomic_group_sets.items()}

def get_species_row(taxon_info, taxonomic_group_sets):
  species_info = taxon_info["taxonomy"]["classification"]["species"]
  return {
    "taxonomyId": taxon_info["taxonomy"]["tax_id"],
    "species": species_info["name"],
    "speciesTaxonomyId": species_info["id"],
    **get_taxonomic_group_sets(taxon_info["taxonomy"]["parents"], taxonomic_group_sets)
  }

def get_species_df(taxonomy_ids, taxonomic_group_sets):
  species_info = get_paginated_ncbi_results(f"https://api.ncbi.nlm.nih.gov/datasets/v2/taxonomy/taxon/{",".join([str(id) for id in taxonomy_ids])}/dataset_report", "taxa")
  return pd.DataFrame([get_species_row(info, taxonomic_group_sets) for info in species_info])

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
    "scaffoldCount": genome_info["assembly_stats"].get("number_of_scaffolds"),
    "scaffoldN50": genome_info["assembly_stats"].get("scaffold_n50"),
    "scaffoldL50": genome_info["assembly_stats"].get("scaffold_l50"),
    "coverage": genome_info["assembly_stats"].get("genome_coverage"),
    "gcPercent": genome_info["assembly_stats"]["gc_percent"],
    "annotationStatus": genome_info.get("annotation_info", {}).get("status"),
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

def report_missing_values_from(values_name, message_predicate, all_values_series, *partial_values_series):
  present_values_mask = all_values_series.astype(bool)
  present_values_mask[:] = False
  for series in partial_values_series:
    present_values_mask |= all_values_series.isin(series)
  report_missing_values(values_name, message_predicate, all_values_series, present_values_mask)

def report_missing_values(values_name, message_predicate, values_series, present_values_mask):
  missing_values = values_series[~present_values_mask]
  if len(missing_values) > 0:
    if len(missing_values) > len(values_series)/2:
      print(f"Only {len(missing_values)} of {len(values_series)} {values_name} {message_predicate}: {", ".join(message_predicate[present_values_mask])}")
    else:
      print(f"{len(missing_values)} {values_name} not {message_predicate}: {", ".join(missing_values)}")

def build_files(assemblies_path, genomes_output_path, ucsc_assemblies_url, taxonomic_group_sets={}, do_gene_model_urls=True):
  print("Building files")

  source_list_df = read_assemblies(assemblies_path)

  base_genomes_df = get_genomes_df(source_list_df["accession"])

  report_missing_values_from("accessions", "found on NCBI", source_list_df["accession"], base_genomes_df["accession"])

  species_df = get_species_df(base_genomes_df["taxonomyId"], taxonomic_group_sets)

  report_missing_values_from("species", "found on NCBI", base_genomes_df["taxonomyId"], species_df["taxonomyId"])

  genomes_with_species_df = base_genomes_df.merge(species_df, how="left", on="taxonomyId")

  assemblies_df = pd.DataFrame(requests.get(ucsc_assemblies_url).json()["data"])[["ucscBrowser", "genBank", "refSeq"]]

  gen_bank_merge_df = genomes_with_species_df.merge(assemblies_df, how="left", left_on="accession", right_on="genBank")
  ref_seq_merge_df = genomes_with_species_df.merge(assemblies_df, how="left", left_on="accession", right_on="refSeq")

  report_missing_values_from("accessions", "matched in assembly list", genomes_with_species_df["accession"], assemblies_df["genBank"], assemblies_df["refSeq"])
  
  genomes_df = gen_bank_merge_df.combine_first(ref_seq_merge_df)

  if do_gene_model_urls:
    genomes_df = add_gene_model_url(genomes_df)
    report_missing_values("accessions", "matched with gene model URLs", genomes_df["accession"], genomes_df["geneModelUrl"].astype(bool))
  else:
    genomes_df["geneModelUrl"] = ""

  genomes_df.to_csv(genomes_output_path, index=False, sep="\t")

  print(f"Wrote to {genomes_output_path}")
