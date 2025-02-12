import pandas as pd
import yaml
import requests
import urllib
import re
import time
from bs4 import BeautifulSoup

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

def get_biosample_data(genome_info):
  return {
    "accession": genome_info["accession"],
    "biosample": genome_info["assembly_info"]["biosample"]["accession"],
    'sample_ids': ",".join([f"{sample['db']}:{sample['value']}" for sample in genome_info["assembly_info"]["biosample"]['sample_ids'] if 'db' in sample]),
  }

def get_genomes_and_primarydata_df(accessions):
  genomes_info = get_paginated_ncbi_results(f"https://api.ncbi.nlm.nih.gov/datasets/v2/genome/accession/{",".join(accessions)}/dataset_report", "genomes")

  return pd.DataFrame(data=[get_genome_row(info) for info in genomes_info]), pd.DataFrame(data=[get_biosample_data(info) for info in genomes_info if  'biosample' in info['assembly_info']])

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
      present_values = values_series[present_values_mask]
      print(f"Only {len(present_values)} of {len(values_series)} {values_name} {message_predicate}: {", ".join(present_values)}")
    else:
      print(f"{len(missing_values)} {values_name} not {message_predicate}: {", ".join(missing_values)}")

def fetch_sra_metadata(srs_ids):
  #print(f"Fetching metadata for SRS {srs_id}")
  if srs_ids is None:
    return None

  data = {}
  sample_run_acc_mapper = {}

  batch_size = 20
  counter = 0
  max_requests_before_wait = 2
  wait_time = 5
  for i in range(0, len(srs_ids), batch_size):
    batch_srs_id = srs_ids[i:i + batch_size]
    if counter >= max_requests_before_wait:
          time.sleep(wait_time)
          counter = 0
    search_url = f"https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=sra&term={"+OR+".join(batch_srs_id)}&retmode=json&retmax=1000"
    #print(search_url)
    search_response = requests.get(search_url)
    search_data = search_response.json()
    if int(search_data.get("esearchresult", {}).get("count", 0)) == 0:
      #print(f"No SRR IDs found for SRS {srs_id}")
      return None

    # Extract SRR IDs
    srr_ids = search_data.get("esearchresult", {}).get("idlist", [])
    if srr_ids:
      # Step 2: Fetch Metadata for SRR IDs
      for i in range(0, len(srr_ids), batch_size):
        if counter >= max_requests_before_wait:
          time.sleep(wait_time)
          counter = 0
        batch_srr_id = srr_ids[i:i + batch_size]
        srr_str = ",".join(batch_srr_id)
        summary_url = f"https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=sra&id={srr_str}&retmode=json&retmax=1000"
        print(summary_url)
        # try:
        response = requests.get(summary_url)
        summary_data = response.json()
        counter += 1
        if 'result' in summary_data:
          for result in summary_data['result']['uids']:
              exp_soup = BeautifulSoup(f"<Root>{summary_data['result'][result]['expxml']}</Root>", 'xml')
              run_soup = BeautifulSoup(f"<Root>{summary_data['result'][result]['runs']}</Root>", 'xml')

              # Extract data
              title = exp_soup.find("Title").text
              platform = exp_soup.find("Platform").text
              instrument = exp_soup.find("Platform")["instrument_model"]
              total_spots = exp_soup.find("Statistics")["total_spots"]
              total_bases = exp_soup.find("Statistics")["total_bases"]
              submitter_acc = exp_soup.find("Submitter")["acc"]

              study_acc = exp_soup.find("Study")["acc"]
              organism_name = exp_soup.find("Organism").get("ScientificName", "")
              experiment_acc = exp_soup.find("Experiment")["acc"]
              library_name = exp_soup.find("LIBRARY_NAME").text if exp_soup.find("LIBRARY_NAME") else ""
              library_strategy = exp_soup.find("LIBRARY_STRATEGY").text if exp_soup.find("LIBRARY_STRATEGY") else ""
              library_source = exp_soup.find("LIBRARY_SOURCE").text if exp_soup.find("LIBRARY_SOURCE") else ""
              library_selection = exp_soup.find("LIBRARY_SELECTION").text if exp_soup.find("LIBRARY_SELECTION") else ""
              bioproject_elem = exp_soup.find("Bioproject")
              bioproject = bioproject_elem.text if bioproject_elem else ""
              biosample = exp_soup.find("Biosample").text
              sample_acc = exp_soup.find("Sample")["acc"]
              run_acc = run_soup.find("Run")["acc"]
              run_total_bases = run_soup.find("Run")["total_bases"]
              run_total_spots = run_soup.find("Run")["total_bases"]

              for run in run_soup.find_all("Run"):
                run_acc = run["acc"]
                run_total_bases = run["total_bases"]
                run_total_spots = run["total_spots"]

                # Print extracted information
                d = {
                "title": title,
                "platform": platform,
                "instrument": instrument,
                "total_spots": total_spots,
                "total_bases": total_bases,
                "submitter_acc": submitter_acc,
                "study_acc": study_acc,
                "organism_name": organism_name,
                "experiment_acc": experiment_acc,
                "library_name": library_name,
                "library_strategy": library_strategy,
                "library_source": library_source,
                "library_selection": library_selection,
                "bioproject": bioproject,
                "biosample": biosample,
                "run_acc": run_acc,
                "run_total_bases": run_total_bases,
                "run_total_spots": run_total_spots,
                'srs_sample_acc': sample_acc
                }

                if sample_acc in data:
                    if run_acc in data[sample_acc]:
                        raise Exception(f"Duplicate biosample run_acc {run_acc} found {sample_acc}")
                    else:
                        data[sample_acc][run_acc] = d
                else:
                    data[sample_acc] = {run_acc: d}
                sample_run_acc_mapper[run_acc] = sample_acc
  for sample_acc in data:
    print(f"Fetching file list for {sample_acc}")
    file_list_url = f"https://www.ebi.ac.uk/ena/portal/api/filereport?accession={sample_acc}&result=read_run&format=json&retmax=1000"
    #May need to remove this later
    if counter >= max_requests_before_wait:
      time.sleep(wait_time)
      counter = 0
    file_list_data = requests.get(file_list_url).json()
    for result in file_list_data:
      if result['run_accession'] not in data[sample_acc]:
        raise Exception(f"Not metadata found for {result['run_accession']} {sample_acc}")
      if 'fastq_ftp' in data[sample_acc][result['run_accession']]:
        raise Exception(f"Duplicate file list entry for {result['run_accession']}  {sample_acc}")

      data[sample_acc][result['run_accession']]['file_urls'] = result['fastq_ftp']
      data[sample_acc][result['run_accession']]['file_size'] = result['fastq_bytes']
      data[sample_acc][result['run_accession']]['file_md5'] = result['fastq_md5']
  print("Returning......................\n\n\n")
  return data


def build_files(assemblies_path, genomes_output_path, primary_output_path, ucsc_assemblies_url, taxonomic_group_sets={}, do_gene_model_urls=True, extract_data=None):
  print("Building files")

  source_list_df = read_assemblies(assemblies_path)

  base_genomes_df, primarydata_df = get_genomes_and_primarydata_df(source_list_df["accession"])

  primarydata_df['sra_ids'] = primarydata_df["sample_ids"].str.split(",")
  primarydata_df = primarydata_df.explode("sra_ids")
  primarydata_df = primarydata_df[~primarydata_df["sra_ids"].isnull() & primarydata_df["sra_ids"].str.startswith('SRA')]
  primarydata_df["sra_ids"] = primarydata_df["sra_ids"].str.replace("SRA:", "")
  
  sra_ids_list = primarydata_df["sra_ids"].dropna().unique().tolist()

  sra_metadata = fetch_sra_metadata(sra_ids_list)
  
  sra_metadata_df = pd.DataFrame([sra_metadata[sra][srr] for sra in sra_metadata for srr in sra_metadata[sra]])
  primarydata_df = primarydata_df.merge(sra_metadata_df, how="left", left_on="sra_ids", right_on="srs_sample_acc")
  
  
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
  print(primarydata_df)
  primarydata_df.to_csv(primary_output_path, index=False, sep="\t")

  print(f"Wrote to {primary_output_path}")
