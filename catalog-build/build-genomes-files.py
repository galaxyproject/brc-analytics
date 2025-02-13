import pandas as pd
import re
import requests
import urllib.parse

GENOMES_SOURCE_URL = "https://docs.google.com/spreadsheets/d/1NRfTvebPl6zJ0l9tCqBtq6YCrwV6_XDBlheq3L5HcvQ/gviz/tq?tqx=out:csv&sheet=GenomeDataTypes_Summary.csv"
ASSEMBLIES_URL = "https://hgdownload.soe.ucsc.edu/hubs/BRC/assemblyList.json"

OUTPUT_PATH = "files/source/genomes.tsv"


def get_duplicate_ids(genomes_df):
  counts = genomes_df["Genome Version/Assembly ID"].value_counts()
  return list(counts.index.to_series().loc[counts > 1])


def get_unmatched_assemblies(assemblies_df, result_df):
  return set(assemblies_df["asmId"]) - set(result_df["asmId"])


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


def add_gene_model_url(result_df: pd.DataFrame):
    "https://hgdownload.soe.ucsc.edu/hubs/GCF/001/189/475/GCF_001189475.1"
    result_df["geneModelUrl"] = result_df["Genome Version/Assembly ID"].apply(_id_to_gene_model_url)


def build_genomes_files():
  print("Building files")

  genomes_source_df = pd.read_csv(GENOMES_SOURCE_URL, keep_default_na=False, usecols=lambda name: re.fullmatch(r"Unnamed: \d+", name) is None)
  assemblies_df = pd.DataFrame(requests.get(ASSEMBLIES_URL).json()["data"])

  duplicate_ids = get_duplicate_ids(genomes_source_df)
  print(f"Removing rows with duplicate Genome Version/Assembly ID values of: {', '.join(duplicate_ids)}")

  deduped_genomes_df = genomes_source_df.drop_duplicates(subset=["Genome Version/Assembly ID"])

  gen_bank_merge_df = deduped_genomes_df.merge(assemblies_df, how="left", left_on="Genome Version/Assembly ID", right_on="genBank")
  ref_seq_merge_df = deduped_genomes_df.merge(assemblies_df, how="left", left_on="Genome Version/Assembly ID", right_on="refSeq")

  result_df = gen_bank_merge_df.combine_first(ref_seq_merge_df).dropna(subset=["ucscBrowser"])

  add_gene_model_url(result_df)

  unmatched_assemblies = get_unmatched_assemblies(assemblies_df, result_df)
  if (len(unmatched_assemblies) != 0):
    print(f"Omitted {len(unmatched_assemblies)} assemblies that had no matches: {', '.join(unmatched_assemblies)}")

  result_df["taxId"] = result_df["taxId"].astype(int)

  result_df.to_csv(OUTPUT_PATH, index=False, sep="\t")

  print(f"Wrote to {OUTPUT_PATH}")


if __name__ == "__main__":
  build_genomes_files()
