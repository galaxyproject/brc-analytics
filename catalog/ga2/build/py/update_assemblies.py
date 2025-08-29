import pandas as pd

UCSC_ASSEMBLIES_SET_URL = (
    "https://hgdownload.soe.ucsc.edu/hubs/VGP/alignment/vgp.alignment.set.metaData.txt"
)
ASSEMBLIES_PATH = "catalog/ga2/source/assemblies.yml"


def update_assemblies_file(url, output):
    try:
        df = pd.read_csv(url, sep="\t")
    except Exception as e:
        print(f"Error fetching data from URL {url}: {e}")
        return

    try:
        with open(output, "w") as writer:
            writer.write("assemblies:")
            for _, row in df.sort_values("sciName").iterrows():
                accession = row["accession"]
                sci_name = row["sciName"]
                writer.write(f"\n # {sci_name}\n - accession: {accession}")
    except Exception as e:
        print(f"Error writing to file {output}: {e}")


if __name__ == "__main__":
    update_assemblies_file(UCSC_ASSEMBLIES_SET_URL, ASSEMBLIES_PATH)
