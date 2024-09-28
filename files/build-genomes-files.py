import pandas as pd
import re
import requests

GENOMES_SOURCE_URL = "https://docs.google.com/spreadsheets/d/1NRfTvebPl6zJ0l9tCqBtq6YCrwV6_XDBlheq3L5HcvQ/gviz/tq?tqx=out:csv&sheet=GenomeDataTypes_Summary.csv"
ASSEMBLIES_URL = "https://hgdownload.soe.ucsc.edu/hubs/BRC/assemblyList.json"

OUTPUT_PATH = "files/source/genomes.tsv"

def get_duplicate_ids(genomes_df):
  counts = genomes_df["Genome Version/Assembly ID"].value_counts()
  return list(counts.index.to_series().loc[counts > 1])

def get_unmatched_assemblies(assemblies_df, result_df):
  return set(assemblies_df["asmId"]) - set(result_df["asmId"])

def build_genomes_files():
  print("Building files")

  genomes_source_df = pd.read_csv(GENOMES_SOURCE_URL, keep_default_na=False, usecols=lambda name: re.fullmatch(r"Unnamed: \d+", name) is None)
  assemblies_df = pd.DataFrame(requests.get(ASSEMBLIES_URL).json()["data"])

  duplicate_ids = get_duplicate_ids(genomes_source_df)
  print(f"Removing rows with duplicate Genome Version/Assembly ID values of: {", ".join(duplicate_ids)}")

  deduped_genomes_df = genomes_source_df.drop_duplicates(subset=["Genome Version/Assembly ID"])
  
  gen_bank_merge_df = deduped_genomes_df.merge(assemblies_df, how="left", left_on="Genome Version/Assembly ID", right_on="genBank")
  ref_seq_merge_df = deduped_genomes_df.merge(assemblies_df, how="left", left_on="Genome Version/Assembly ID", right_on="refSeq")

  result_df = gen_bank_merge_df.combine_first(ref_seq_merge_df).dropna(subset=["ucscBrowser"])

  unmatched_assemblies = get_unmatched_assemblies(assemblies_df, result_df)
  if (len(unmatched_assemblies) != 0):
    print(f"Omitted {len(unmatched_assemblies)} assemblies that had no matches: {", ".join(unmatched_assemblies)}")

  result_df["taxId"] = result_df["taxId"].astype(int)

  result_df.to_csv(OUTPUT_PATH, index=False, sep="\t")

  print(f"Wrote to {OUTPUT_PATH}")

if __name__ == "__main__":
  build_genomes_files()
