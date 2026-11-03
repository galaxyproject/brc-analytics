# BioNym graphs (temporary)

These are [BioNym](https://github.com/d-callan/bionym) knowledge graphs for
three _P. falciparum_ 3D7 genes. `GET /api/v1/genes/{gene_uid}/bionym` reads
them to show BioNym's claims about a gene on its gene page.

They are checked in for now only. They move to the gene data store, next to
the gene snapshots, when graphs are published there ("Gene pages: show the
evidence BioNym gathers about a gene", #1943, work item 3), and this directory
is then removed.

## Files

Each file is BioNym's JSON output exactly as received, gzipped
(`gzip -9 -n`). It is named by the gene's UID in the gene snapshot, because
BioNym keys a graph by its input, the locus tag.

| File                                           | Gene    | BioNym input    | Run date   | Received as                  |
| ---------------------------------------------- | ------- | --------------- | ---------- | ---------------------------- |
| `f0adadd3-973b-5c61-9e11-7c688b4e0895.json.gz` | Kelch13 | `PF3D7_1343700` | 2026-11-02 | `kelch13_PF3D7_1343700.json` |
| `01acd065-284a-5e6d-9ffd-92ec072b2b01.json.gz` | CRT     | `PF3D7_0709000` | 2026-11-02 | `crt_PF3D7_0709000.json`     |
| `d9049485-ed74-5455-98c2-5dc13eef544a.json.gz` | AMA1    | `PF3D7_1133400` | 2026-11-02 | `ama1_PF3D7_1133400.json`    |

- **Source:** Danielle Callan ran BioNym and sent the three graphs on
  2026-11-02 as `bionym-demo-graphs.zip`.
- **BioNym input:** the graph's `metadata.input`.
- **Run date:** the graph's metadata carries no run date, so the API takes the
  latest `retrieved_at` among the graph's evidence; all three are 2026-11-02
  (UTC).
- **Gene UID:** the snapshot's UUIDv5 of `GCF_000002765.6:gene-<locus tag>`
  (`catalog_build.genes.build_gene_snapshot.gene_uid`).

## Adding a graph

Gzip BioNym's JSON unchanged, name it `<gene_uid>.json.gz`, and add a row to
the table above.
