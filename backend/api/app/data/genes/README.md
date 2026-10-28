# Temporary gene snapshot

`genes-3d7.duckdb` holds the genes of _Plasmodium falciparum_ 3D7 (`GCF_000002765.6`) from NCBI RefSeq's annotation (`RS_2026_09`). The gene API (`app/services/gene_catalog.py`) reads it until a real gene snapshot exists.

**Checking this file in is temporary (#1904).** The real gene snapshot is built off the server from the provenance database, and the deploy playbook downloads it into a directory mounted on the server; it is never committed (#1892, gene catalog contract). When the first real snapshot is deployed, point `GENE_SNAPSHOT_PATH` at it and delete this file, this README and the exception for it in the repo's `.gitignore`.

Each regeneration adds a new copy (about 2.5 MB compressed) to git history, so regenerate only when the tables change. From `catalog/py_package`, with the catalog build's requirements installed:

```bash
python -m catalog_build.genes.build_gene_snapshot \
  --assembly GCF_000002765.6 \
  --gff3 https://ftp.ncbi.nlm.nih.gov/genomes/all/GCF/000/002/765/GCF_000002765.6_GCA_000002765/GCF_000002765.6_GCA_000002765_genomic.gff.gz \
  --out ../../backend/api/app/data/genes/genes-3d7.duckdb
```

The command also downloads NCBI's GTF beside the GFF3 and checks every gene against it; if they disagree it writes nothing and names the differences.

The generator stays when this file goes: its GFF3 reading and the GTF check move into the real build.
