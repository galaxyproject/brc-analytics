# Gene Catalog: v1 Design Contract

> **Draft, under review.** This contract will be updated as we implement it and it meets reality. It is a general guide: it records our decisions and informs the coding agent that builds against it. Discussion is on #1892 (gene catalog: v1 design contract).

Part of #1776 (gene pages umbrella). This contract fixes the interfaces the build issues implement: how genes are identified, what every answer says about where it came from, how what we read from the publishers is recorded, what a snapshot of the gene data holds, how it is published and served, and what the API returns. Each build issue names the section it implements.

It was informed and inspired by #1783 (gene catalog: serving architecture, by @dannon), which it replaces. The reasoning and evidence behind it are in the documents beside it: [gene-provenance-spec.md](gene-provenance-spec.md) for requirements, [gene-annotation-schema.md](gene-annotation-schema.md) for tables, and [gene-history-findings.md](gene-history-findings.md) for rebuilding past gene history.

## What this is for

**v0 is gene pages:** every gene in the catalog's NCBI annotations gets a page, and its IDs can be looked up. It reads only the publisher's own annotation files, so none of UCSC's GTF problems apply to it.

Two bets drive the rest of the design. Most of what is heavier than a plain gene lookup traces to one of them; the rest (R7–R11) would be needed anyway. v0 needs neither bet, but is built so that both can be added without changing gene addresses.

1. **Knowing exactly which GTF a workflow used matters,** because GTF files change with no outside sign. This is v1: linking a workflow run's results back to the exact annotation its GTF held.
2. **Showing a gene's lineage matters,** because papers and older results use gene IDs that publishers have since renamed, merged or retired. This is later.

### Use cases

"My results" means the output of an analysis, for example the counts table from an RNA-seq run. In v0, its gene IDs can be looked up from any tool's output. In v1, results from a workflow run in Galaxy, launched from BRC, are also linked to the exact annotation the run used: the run keeps the exact GTF it used as a dataset in its history, and BRC sends Galaxy that GTF's `md5` at launch.

| Use case                                                        | Example                                                                                                                                                                                                                                                                      | Bet | When  |
| --------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --- | ----- |
| **Tell me about a gene**                                        | The page shows product name, location, protein accession and where they come from                                                                                                                                                                                            | —   | v0    |
| **Name the genes in my results**                                | A counts table lists `PVP01_0910200`; each row gets its product name, from the assembly's latest annotation, and a link to its gene page                                                                                                                                     | —   | v0    |
| **An AI app labels my results**                                 | An AI app reads a counts table and labels it in one call to BRC's MCP server                                                                                                                                                                                                 | —   | v0    |
| **Which annotation did my Galaxy run use?**                     | The run's GTF `md5`, sent to Galaxy when BRC launched it, leads to "NCBI GenBank's annotation of `GCA_900093555.2`, genes as of 2020-06-17"; a GTF BRC has never seen is reported as unknown                                                                                 | 1   | v1    |
| **What was this gene in my run, and is there a newer version?** | A gene link from a P01 run opens the gene as the run's annotation described it. If a newer annotation of the same assembly changed the gene, a banner says so ("changed in a newer NCBI annotation, genes as of …: see the latest"), so you can decide whether to re-analyse | 1   | v1    |
| **Why does BRC differ from the publisher?**                     | BRC shows VEuPathDB release 68 while VEuPathDB is on 71                                                                                                                                                                                                                      | 1   | Later |
| **An old ID finds the current gene**                            | `PF11_0344` from a paper leads to AMA1's page: "previous ID, per VEuPathDB"                                                                                                                                                                                                  | 2   | Later |
| **What happened to this gene?**                                 | `PF3D7_0112400`: "retired; in VEuPathDB release 24, gone by release 71"                                                                                                                                                                                                      | 2   | Later |
| **The same gene on a newer assembly**                           | The gene's page on `GCA_x.2` says "a newer version of this gene is on `GCA_x.3`", for re-analysing on the newer assembly                                                                                                                                                     | 2   | Later |

### Key requirements

"When" is the first build that has the requirement; each build keeps everything before it.

| #   | Requirement                                                                                                                                                                                                                                                     | Why                                                                                                                                                                                                                                                                | When                                       | Section |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------ | ------- |
| R1  | A GTF leads to the exact annotation it holds by its `md5`, never by its name, URL or release label                                                                                                                                                              | GTFs change silently: NCBI changed P01's genes and kept its 2019 date, and UCSC rewrites GTFs in place with no release label (evidence below)                                                                                                                      | v1                                         | 2, 3, 6 |
| R2  | Every annotation file we read is kept, with its checksums and the date we read it                                                                                                                                                                               | Publishers overwrite their files. A GTF we never kept can't be recognised later (R1), and past changes can only be rebuilt from files we have                                                                                                                      | v0                                         | 2, 4    |
| R3  | Every answer names the annotation it comes from, and which build of BRC's gene data it was read from                                                                                                                                                            | A result can be explained and cited, and an answer that changes can be traced                                                                                                                                                                                      | v0                                         | 2, 6    |
| R4  | A gene's page address never changes and its page is never removed: not through renames, merges or splits, nor when a different publisher's description becomes the one shown. A pinned address (one annotation's view of the gene) keeps showing the same thing | Links in results, downloads, saved lists and papers keep working, and a link from a run keeps showing the gene as the run's annotation described it                                                                                                                | v0; pinned addresses v1; later the changes | 1       |
| R5  | Every ID a gene has had finds it, labelled with who stated it                                                                                                                                                                                                   | AMA1 was `PF11_0344` before 2012. 285 _P. falciparum_ 3D7 gene IDs in VEuPathDB release 24 are gone by release 71                                                                                                                                                  | Later; v0 and v1 find current IDs only     | 1, 3, 7 |
| R6  | Changes to a gene are recorded each time we update from the publishers, with the date seen. What a publisher states is kept apart from what we infer                                                                                                            | Our copies of the files keep what publishers said; only our records keep what we concluded from them, such as which publisher genes form one gene, and page addresses depend on that. Inferences can be wrong, so each must be traceable to its rule and removable | Later, with the change history             | 7       |
| R7  | A gene page belongs to one assembly version. The same gene ID on a newer assembly version gets its own page, linked to the old one (see Open decisions)                                                                                                         | A location, a gene model and a workflow's GTF each refer to one assembly version; a page spanning versions would have to label every fact with its version                                                                                                         | v0                                         | 1       |
| R8  | The page, search box (ID lookup), MCP tools and, once it exists, the download give the same answer                                                                                                                                                              | They all call one service reading the same data                                                                                                                                                                                                                    | v0                                         | 6       |
| R9  | A whole counts table is labelled in one call                                                                                                                                                                                                                    | About 7,000 gene IDs for P01; larger genomes have more                                                                                                                                                                                                             | v0                                         | 6       |
| R10 | Gene data is updated, and rolled back, without a site deploy                                                                                                                                                                                                    | Publishers release on their own schedules                                                                                                                                                                                                                          | v0, with an API restart                    | 5       |
| R11 | Adding an assembly is a source-list entry, not code                                                                                                                                                                                                             | v0 covers every catalog assembly with an NCBI annotation, and new ones join the catalog over time                                                                                                                                                                  | v0                                         | 4, 5    |

**R1's evidence.** NCBI changed P01's genes on 2020-06-17 and still dates the annotation 2019-08-01. None of the catalog's 2,031 UCSC `ncbiGene` tracks has a release label. 321 of the catalog's 2,419 UCSC GTFs copied from NCBI (13%) were built before NCBI last changed the genes' locations, a median of 179 days before; 306 of them are bacteria (#1874, GenArk GTFs behind NCBI's annotation). When BRC launches a workflow, it sends Galaxy the GTF's `md5` from UCSC's `md5sum.txt` where UCSC lists one, as it does for P01.

### If a bet is wrong

v0 stands either way. Without bet 1, v1 isn't built: R1 goes, and sections 2–4 stay as v0 has them. Without bet 2, R5, R6 and section 7 go, and R4 shrinks to keeping a page's address when a different publisher's description becomes the one shown.

## Scope

**v0, gene pages:** every catalog assembly with an NCBI annotation file (a GFF3), from NCBI GenBank or NCBI RefSeq. Every gene in it gets a page, and its IDs can be looked up one at a time or a whole table at once. v0 reads only the publisher's files; it reads no UCSC GTFs and doesn't link workflow runs. It is built and checked first on _P. vivax_ P01 (`GCA_900093555.2`, NCBI GenBank's annotation submitted by WTSI), then the source list is extended to every assembly; nothing in the design is specific to P01. Each gene page shows what the NCBI file has, so symbols and NCBI GeneIDs appear where the file carries them, as RefSeq files usually do. That is about 2,412 catalog assemblies and 18 million genes, whose NCBI GFF3s total about 4 GB gzipped (section 4).

**v1, results linked to annotations:** a workflow run's results lead to the exact annotation its GTF held (R1), and from there to each gene as that annotation described it (pinned addresses). This needs UCSC's GTFs: each is checked against the publisher's file and mapped gene by gene. v1 covers the UCSC GTFs that pass that check; P01's `ncbiGene` GTF does. v1 assumes UCSC's GTFs are fixed by then: today they split transcripts, merge genes that share a name, and in many augustus GTFs leave out exon rows. If they aren't fixed, how to warn about the differences, or whether to convert NCBI's GFF3 to GTF ourselves (the spec's fallback option), is decided when v1 is built. Runs on P01's `veupathGenes` GTF (VEuPathDB release 68) come later.

The contract is written for more than v1, so later publishers and assemblies add rows, not redesigns. What v0 and v1 build of each section is marked **v0** or **v1**.

**Later:** VEuPathDB as a publisher (which brings _P. falciparum_ 3D7's current genes), GTFs that don't match the publisher's file, previous IDs, gene history on pages, site-wide search, the on-site assistant's gene tools, genes predicted by software rather than published (UCSC's augustus and xenoRefGene tracks).

## Terms

**Where genes come from**

- **Publisher:** who states the genes in an annotation file: NCBI RefSeq, NCBI GenBank (the annotation the submitting lab deposited) or VEuPathDB. UCSC isn't a publisher: its GTFs are copies of a publisher's annotation.
- **Provider:** the lab or pipeline that made the annotation, as the publisher names it, e.g. WTSI (Wellcome Sanger Institute) for P01's GenBank annotation.
- **Release label:** the publisher's own name for a release, verbatim: "release 68", `RS_2026_09`. NCBI GenBank annotations have none; NCBI names them by provider and date, e.g. "Annotation submitted by WTSI", 2019-08-01.
- **Annotation set:** one publisher's annotation of one assembly version, across all its releases, e.g. NCBI GenBank's annotation of `GCA_900093555.2`.
- **Annotation set version:** one state of an annotation set's genes, identified by that content: its core hash and content hash together. The same genes are the same version whatever the label or date says; changed genes are a new version, even under the same label. Release labels and dates are recorded on the version, not used to define it. A file rewritten with the same genes doesn't make a new version.
- **Annotation file version:** one exact GFF3 or GTF file, identified by its bytes (`sha256`, `md5`): the publisher's original or, from v1, a UCSC copy. Several annotation file versions can hold the same annotation set version.
- **Core hash:** a fingerprint of an annotation file's coding sequences (each one's sequence name, strand, start and end), leaving out IDs and names. A UCSC copy has the same core hash as its publisher's original when they hold the same coding sequences.
- **Content hash:** a fingerprint of everything else read from the file about its genes: exon and UTR positions, non-coding genes, gene IDs, symbols, biotypes, products and cross-references. With the core hash, it identifies an annotation set version. It compares versions of one publisher's file, never a UCSC copy with its original.

**Genes**

- **Locus tag:** the gene ID the genome submitter registers with NCBI, meant to stay with the gene for the life of the assembly, e.g. `PVP01_0910200`.
- **Publisher gene ID:** the ID a publisher gives a gene, usually its locus tag.
- **Previous ID:** an ID a publisher says a gene used to have, e.g. `PF11_0344` for AMA1.
- **Gene model:** a gene's structure: its transcripts, exons and coding sequence.
- **Publisher gene:** one gene as one annotation set names it, keyed by annotation set + publisher gene ID. The key stays the same across releases.
- **Record:** what one annotation set version says about one publisher gene: its location, product, gene model and names. A new annotation set version gives the publisher gene a new record only if something about it changed.
- **Gene:** what one gene page shows: one or more publisher genes on one assembly version, grouped by the rules in section 1.
- **`gene_uid`:** a gene's identifier, a random UUID we mint once.
- **Canonical record:** the record a gene's page takes its location, product and gene model from.

**Assemblies and sequences**

- **Assembly version:** one versioned assembly accession, e.g. `GCA_900093555.2`. A GenBank (`GCA_`) and a RefSeq (`GCF_`) accession count as one assembly version only when NCBI pairs them as identical.
- **Sequence digest:** a fingerprint of one sequence (a chromosome or contig) computed from its bases alone, following GA4GH's refget standard. The same bases give the same digest whatever the sequence is called.
- **Genome digest:** the same for a whole assembly: its sequences' names, lengths and digests. One changed contig changes it.
- **Sequence-name map:** an assembly's publisher sequence names (chromosome and contig names, not gene IDs) mapped to the names UCSC's genome browser uses. NCBI and UCSC's GenArk both name sequences by their accessions (P01's are `FLZR02000001.1` and so on), so NCBI annotations need none; it is needed later, for VEuPathDB's own names such as `Pf3D7_01_v3`.

**Recording and serving**

- **Provenance database:** the insert-only record of what we read from the publishers and what we concluded from it, and the only place `gene_uid`s are kept. It is the schema doc's write model: v0 starts it with eight tables (section 4), and the change history adds more later. It is a set of Parquet files in the gene data store, not a database server.
- **Update:** one run that adds rows to the provenance database. It exists once its manifest is committed.
- **Manifest:** an update's record: its predecessor, when it ran and who ran it, the build code's commit, its `schema_version`, row counts, check results, and the full list of table files in effect as of the update.
- **Predecessor:** the update that was the head when an update started. Updates form one chain, never branches.
- **Head:** the latest committed update.
- **Gene data store:** the bucket holding the archived publisher files, the provenance database and the snapshots (section 4).
- **Snapshot:** the gene pages' data, built from the provenance database as of one update and the archived files, as a single file that is never edited. It is complete: the API reads nothing else. The **live** snapshot is the one the API serves.
- **Change history:** the provenance database's record of how each gene changed (the schema doc's `gene_record`, `gene_version` and the tables with them). After v1.
- **Provenance line:** the line under a gene's name saying which annotation it comes from.
- **Pinned address:** a gene's address plus an annotation set version, showing the gene as that annotation described it rather than its latest state (section 1). From v1.

## 1. Identity

- **A gene is identified by `gene_uid`,** a random UUID minted once and never reused. Gene IDs, symbols and accessions are names that find a gene, not its identity, because publishers rename, merge and split genes.
- **Page address (v0):** `/data/genes/<gene_uid>` shows the gene's latest state. The stub detail page (#1814, stub gene detail page PR) is at `/data/genes/detail?uid=` with readable slugs (`pf3d7-1133400`); v0 adds a web server rule for the path form, and the slugs become UUIDs.
- **Pinned address (v1):** `/data/genes/<gene_uid>?annotation=<annotation set version ID>` shows the gene as that annotation described it, with a banner naming the annotation and its date. If a newer annotation of the same assembly changed the gene, the banner says so and links to the latest state, so someone with results from the older annotation can decide whether to re-analyse; later, it also links to the gene on a newer assembly version (section 7). The version in a pinned address is always an annotation, never a gene version number. An annotation set version's ID is its publisher and assembly plus the start of its core and content hashes (e.g. `ncbi-genbank-GCA_900093555.2-3f9a1c2b`, illustrative), so it is readable, never collides on a date, and is the same on every rebuild. The build checks that the hash prefix is unique within the annotation set and uses a longer one if not. This is the only annotation set version ID outside the build: the schema doc's internal `<uuid>@<version>` key maps to it and never appears in an address, API response or download.
- **Publisher genes are keyed by annotation set and publisher gene ID.** This is #1783's `(assembly, source, gene_id)` key. The key stays the same across releases; each release that changes the gene adds a record under it.
- **A gene groups publisher genes** on one assembly version that share a locus tag or that a publisher links. _P. falciparum_ 3D7's AMA1 groups three publisher genes, all with gene ID `PF3D7_1133400`. Their latest records:

  | Record | Publisher and release           | Adds                                    |
  | ------ | ------------------------------- | --------------------------------------- |
  | A      | VEuPathDB (PlasmoDB) release 71 | symbol `AMA1`, previous ID `PF11_0344`  |
  | B      | NCBI RefSeq `RS_2026_09`        | NCBI GeneID `810891`, RefSeq accessions |
  | C      | NCBI GenBank                    | the submitting lab's protein accession  |

  They are one gene with one page, so `810891` and `PF11_0344` lead to the same page. RefSeq's record is on a `GCF_` accession, so it joins the others only if NCBI pairs that accession with the GenBank one as identical (see Assembly version).

- **The canonical record is chosen by a fixed publisher order,** still to be decided (see Open decisions). One record has to win because records can disagree on location, product and gene model. In v0 and v1 each assembly has one publisher, so each gene has one publisher gene, and its latest record is canonical.
- **A gene changes; its `gene_uid` doesn't.** The changes are listed in section 7. Each is recorded in the change history with the date we saw it and a version number. Users see dates and annotations, never the number, which is for internal use. The plain address always shows the latest state; from v1, earlier states are reached through pinned addresses.
- **Each assembly version has its own genes.** Genes on `GCA_x.3` get new `gene_uid`s and pages, and the pages for `GCA_x.2` stay, with the assembly marked "previous". A location only means something on one assembly, and a workflow runs against one exact assembly. Section 7 covers linking a gene to the same gene on a newer assembly version.
- **`gene_uid`s are kept in the provenance database** (section 4), linking each publisher gene to its gene. Each update reads them and only adds to them, so no rebuild changes a page address. `gene_uid` is the one key that can't be recomputed: every other key is derived from what it identifies.

## 2. Provenance

Every answer (page, API response, MCP tool result, download row) names the **annotation set version** it comes from. Every API response and download row also names the **snapshot** it was read from.

- **Each annotation set version records** its assembly, publisher, provider and release label; where known, its release date and the date its genes last changed ("genes as of"; NCBI gives it in `annotation_hashes.txt`); and the publisher's file its genes were read from. NCBI changed P01's genes on 2020-06-17 but still dates the annotation 2019-08-01, so one date covers two sets of genes. We have seen only the later one.
- **Each annotation file version records** its URL, its checksums (`md5` and `sha256` of the bytes as served, and of the uncompressed bytes when the file is gzipped, all computed by BRC from its own copy), retrieval time, our archived copy, and the annotation set version it holds. Publishers overwrite their files, so we keep every file we read from day one, in the gene data store.
- **Both are rows in the provenance database** (section 4), written by the update that first saw them.
- **The provenance line** reads, for P01: "From NCBI GenBank's annotation of `GCA_900093555.2` (submitted by WTSI, 2019-08-01; genes as of 2020-06-17), retrieved …". "Retrieved" is when we fetched the publisher's file the genes were read from.

**v1 adds UCSC's GTFs:**

- **A UCSC copy is tied to an annotation set version by its genes,** not its name or date: its core hash must match the publisher's file, and every gene ID in it must be a gene in the publisher's file. P01's UCSC `ncbiGene` GTF matches NCBI's GFF3 across all 6,683 protein-coding genes. That isn't a full match: UCSC's P01 GTF splits every multi-exon gene into one-exon transcripts, so gene counts are right but transcript-level results aren't, and the same split affects at least one gene in 534 of the catalog's 2,031 `ncbiGene` assemblies (see Scope for how v1 treats this).
- **A workflow's GTF leads to its annotation set version** by its `md5`, matched against any of the checksums BRC computed for that file, so it doesn't matter whether UCSC lists the file in `md5sum.txt` or whether Galaxy kept it compressed: `annotation_file_version` gives the annotation set version and the GTF's gene map, and `gtf_gene_map` gives each GTF gene's `gene_uid`. Links from a run are pinned to that version. A GTF whose `md5` we haven't seen is reported as unknown, never guessed.
- **Old mappings are never dropped.** When a publisher or UCSC rewrites a GTF in place, the new bytes get a new `md5` and a new `annotation_file_version` row. If the rewrite maps the same GTF genes to the same genes, it shares the existing gene map, so it adds one row, not a copy of the map; otherwise it gets a new map. The old `md5` keeps its map, so a run on the old file still resolves to the annotation it used. If the new annotation drops a gene, the old mapping still leads to its page, which says it isn't in the latest annotation (and, once the change history exists, whether it was merged, split or retired).

## 3. Snapshot contents

A snapshot is one DuckDB file, `genes-<build>.duckdb`. It is derived, not the source of truth: it can always be rebuilt from the provenance database as of the update it was built from and the archived publisher files (section 4), so it can be thrown away and rebuilt at any time. It keeps every annotation set version we have read, forever, not just the latest, so every gene page always shows the gene and, from v1, old GTFs and pinned addresses always resolve. Gene rows are stored only when a gene's record changes: each row carries the first annotation set version it applies to, and the gene as of any version is its latest row at or before that version. A gene missing from a newer version gets a row marking it absent from that version on.

**v0 tables:**

| Table                     | One row per                              | Holds                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| ------------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `annotation_set_version`  | annotation set version                   | ID, core hash, content hash, assembly, publisher, provider, release label, release date and genes-as-of date where known, the publisher's file its genes were read from, the date we first saw it                                                                                                                                                                                                                                                      |
| `annotation_file_version` | annotation file version                  | URL, checksums (`md5` and `sha256`, compressed and uncompressed), retrieval time, archived copy, the annotation set version it holds                                                                                                                                                                                                                                                                                                                   |
| `transcript`              | transcript, each time its record changes | `gene_uid`, gene ID, transcript ID, protein accession, location (sequence name, start, end, strand), product, biotype, the first annotation set version the row applies to, and whether the gene is present in it. A gene with no transcript feature in the publisher's file gets one transcript, with the ID `<gene ID>.t1` (P01's GFF3 has no mRNA rows, so each of its protein-coding genes does; its RNA genes keep their own transcript features) |
| `alt_id`                  | ID × gene                                | every ID that finds a gene, with its type, who states it (the publisher, and from v1 whether it came via UCSC's copy), and whether it is current or historical: protein accessions, transcript IDs, symbols and GeneIDs where the file has them; later previous IDs                                                                                                                                                                                    |
| `snapshot`                | snapshot (one row)                       | build ID, `schema_version`, the update it was built from, build time, the commits of `gene-sources.yml` and the build code, and the check report (section 5): each assembly's results and which were held back                                                                                                                                                                                                                                         |

**v1 adds** `gtf_gene_map` (one row per gene map × GTF gene × gene: gene map ID, GTF `gene_id` → `gene_uid`; a GTF `gene_id` that covers several genes gets a row per gene; GTF file versions with the same mapping share one gene map, and maps are never dropped), a gene map ID on each GTF's `annotation_file_version` row, and `alt_id` rows for the transcript IDs in UCSC's GTFs (`VUZ95756.1_2`), marked as coming via UCSC's copy rather than stated by the publisher.

Sequence names are the ones UCSC's genome browser uses for the assembly, so a location opens there as given. For NCBI annotations they are the publisher's own names: the build checks that every sequence carrying a gene in the publisher's file is in UCSC's list of sequence names for the assembly, and an assembly that fails is held back (section 5). A sample of 31 catalog assemblies (2026-10-26) matched in all 31; in one, _Anopheles gambiae_ `GCF_000005575.2`, 49 small unplaced scaffolds are missing from UCSC, but none carries a gene, which is why the check looks only at sequences with genes. Later, for VEuPathDB, the build converts names with a sequence-name map, built from UCSC's `chromAlias.txt` or by matching sequence digests, not by hand.

**Later tables:** `gene_change` (new, modified, renamed, merged, split, retired, each with its date and release), and one table per data type (e.g. protein domains).

## 4. Build inputs and the provenance database

- **A source list in the repo,** `catalog/source/gene-sources.yml`, says which publisher and release apply to each assembly and, from v1, which GTFs map to it. Changing it is a PR. **v0:** one entry per catalog assembly with an NCBI GFF3, starting with P01. **v1:** adds each assembly's UCSC GTF that passes the check in section 5.
- **Cached build files** per assembly, publisher and release, rebuilt only when an input file or the build code changes, so adding one assembly doesn't rebuild the rest.

**The gene data store** is an S3 bucket to start (see Open decisions for whose account). Moving it later, for example to Jetstream, means copying the files and changing the endpoint. It holds:

```
archive/<sha256>/<original stem>.<sha256 prefix>.<extension>   every publisher file we read
provenance/tables/<table>/update-<n>.parquet                    the rows each update added
provenance/updates/<n>.json                                     each update's manifest
provenance/HEAD                                                 the head
snapshots/genes-<build>.duckdb                                  each snapshot, with its sha256
```

- **Every input file is archived** before it's read, with its checksums and retrieval time (section 2). The full `sha256` names its folder, so a key is never reused. The file keeps its original name with the first 8 characters of its `sha256` before the extension (`GCA_900093555.2_GCA_900093555_genomic.b876271f.gff.gz`), so a downloaded copy says which version it is and tools still recognise its format. The original URL is in the provenance database.
- **v0's files are small.** NCBI's GFF3s for the 2,412 v0 assemblies total about 4 GB gzipped: median 0.7 MB, largest 44 MB (mouse, `GCF_000001635.27`), from a sample of 262 on 2026-10-26. Each is read as a stream, never unpacked to disk, and a file whose `md5` in NCBI's `md5checksums.txt` matches our copy isn't downloaded again.

**The provenance database** is the start of the schema doc's write model, in its names and shapes, so later work adds tables rather than converting these. **v0 tables:**

| Table                      | Kind                           | One row per                                                                                                                            | Key                                             |
| -------------------------- | ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| `annotation_set`           | hub                            | annotation set                                                                                                                         | derived from assembly + publisher               |
| `annotation_set_version`   | satellite of `annotation_set`  | annotation set version: core and content hashes, readable ID, provider, release label, release date, genes-as-of date, date first seen | annotation set + version number                 |
| `annotation_file`          | hub                            | file slot, e.g. "NCBI GenBank's GFF3 for `GCA_900093555.2`"; not a URL or bytes                                                        | derived from publisher + assembly + file name   |
| `annotation_file_location` | satellite of `annotation_file` | URL, each time it moves                                                                                                                | slot + update                                   |
| `annotation_file_version`  | satellite of `annotation_file` | exact set of bytes: checksums, size, retrieval time, archive key, the annotation set version it holds                                  | slot + version number                           |
| `publisher_gene`           | hub                            | publisher gene                                                                                                                         | derived from annotation set + publisher gene ID |
| `gene`                     | hub                            | gene: its `gene_uid`                                                                                                                   | `gene_uid`, random, minted once                 |
| `gene_membership`          | link                           | publisher gene × gene: which publisher genes make up a gene; one-to-one in v0, since each assembly has one publisher                   | derived from both keys                          |

- **Every row records the update that wrote it.** Hubs are written once; satellites add a row when something changes. A derived key is a name-based UUID (UUIDv5) of the natural key, so it is the same on every machine and rebuild. What publishers state (the satellites and `publisher_gene`) is kept apart from what we conclude (`gene` and `gene_membership`).
- **What can't be recomputed:** the minted `gene_uid`s, which publisher genes they group, and the dates we saw things. Everything else can be recomputed from the archive.
- **Gene records aren't stored in v0.** The snapshot reads genes from the archived files, through the cached build files. Records come with the change history, backfilled from the archive.

**Updates only add files.** An update writes one Parquet file per table holding only its new rows, sorted by assembly. Existing files are never rewritten. Its manifest lists every table file in effect, its own and all earlier ones, so the provenance database as of any update is read from that update's manifest alone.

- **Committing an update:** upload its table files, then its manifest, then move `HEAD` to it, but only if `HEAD` still names its predecessor. If it doesn't, someone else committed first: the update is refused and rebuilt from the new head. Files no manifest lists are never read, so a failed upload leaves nothing half-written. Rolling back moves `HEAD` back.
- **DuckDB enforces the keys.** An update is written in a local DuckDB file loaded with the head's rows, whose tables declare their primary keys and the references between them. A duplicate key or a reference that doesn't resolve fails the insert. Each assembly's rows go in as one transaction, so a failure holds back that assembly, as a failed check does (section 5). The update's Parquet files are written only from that file. Checks before commit cover what constraints can't: no `gene_uid` or membership is lost or changed. A file uploaded to the bucket some other way would bypass all this; the bucket's rules below prevent that.
- **Schema changes never edit files.** A new column or table: older files are read with the column empty (DuckDB's `union_by_name`). A value for old rows: new rows saying so, as of the update that learned it. A restructure: a migration update writes the same rows in the new layout as new files, keeping each row's original update, and its manifest lists only the new files. The old files and manifests stay, so the state before a migration is always kept and rolling back moves `HEAD`. A migration changes shape, not facts: snapshots built from the heads before and after it must be identical. Each manifest records its `schema_version`.
- **The bucket's rules:** versioning on, with no lifecycle rule that expires old versions; object lock on `archive/` and `provenance/tables/`; after each commit, new files copied to a second account; write access only for whoever commits updates, read-only for the servers.

## 5. Updating, building and publishing

Two steps: update the provenance database, then build and publish a snapshot from it. Only publishing touches the live server, and only to download a file.

**Step 1, update the provenance database.** In v0 it runs on a developer machine, so a run can be watched and debugged; CI can come later.

1. Start from the head. For each assembly in `gene-sources.yml` that is new or whose publisher file changed: download the file, compute its checksums, archive it if its bytes are new, and parse it.
2. Write the update's rows into the local DuckDB file (section 4): new file versions and locations, new annotation set versions, new publisher genes, and a minted `gene_uid` and membership for each new one.
3. Run the checks below and section 4's, and look at the result locally with DuckDB.
4. Commit (section 4).

**Step 2, build and publish a snapshot:**

1. **Build** from the head: read its tables and the cached build files, write `genes-<build>.duckdb` with its check report (its tables declare their keys, so DuckDB checks them as it builds), and upload it to `snapshots/`.
2. **Smoke test:** dev downloads the snapshot and loads it into the app; run the API validation script and look around the pages by hand.
3. **Publish:** production downloads the same file. Both downloads are a target in the deploy playbook (`galaxyproject/brc-analytics-playbook`), like the organism images' `make fetch-images`: it fetches the snapshot, checks its `sha256`, puts it in the mounted directory, replaces the symlink atomically and restarts the API. The servers pull because nothing outside can reach them (their SSH needs a VPN and MFA). Nothing is built or checked on the live server, apart from the guard below.

**Both chains are linear.** The commit refuses an update whose predecessor isn't the head (section 4). Publish refuses a snapshot built from an older update than the live one's, so a publish never steps back by accident; rollback is exempt, since going back is its purpose. A snapshot holds nothing the provenance database doesn't, so publishing one can't lose data.

**Checks:**

- **Per assembly,** before commit, holding back one assembly, not the update. An assembly that fails writes no rows in the update and keeps its previous state, and the manifest and check report list it; everything else goes ahead. A new assembly that fails is left out and listed. An assembly fails if:
  - its publisher file is missing or can't be read;
  - a sequence carrying a gene in its publisher file isn't one UCSC's genome browser knows for the assembly (section 3);
  - it loses or changes more than a set share of genes or IDs compared with the head, unless `gene-sources.yml` marks the change as expected;
  - (**v1**) a GTF listed for it doesn't match the publisher file `gene-sources.yml` declares: a different core hash, or a GTF gene ID that isn't a gene in that file (all 6,836 of P01's are).
- **On the whole snapshot,** before publish: its `schema_version` must be one the backend it will be published to can read.

**Serving:**

- **One mounted directory,** `/opt/brc-analytics-data/genes/`, read-only in the API container, holding the snapshots and a relative `current.duckdb` symlink to the live one. A directory, not a file, because a single-file mount keeps the old file until the container is recreated.
- **Rollback:** point the symlink back and restart the API. Keep the last few snapshots on the server; every snapshot stays in the gene data store.
- **Schema changes go backend first:** a backend release learns to read version N+1 while still reading N, and only then is an N+1 snapshot published.
- **The backend refuses to start** if `current.duckdb` is missing, with a clear error. The MCP gene tools are always on; the pages are behind the `gene-pages` flag.
- **Later:** picking up a new snapshot without a restart.

## 6. API

**One backend service** (`GeneCatalogService`) answers every gene question. The MCP tools, web API, gene page and search box all call it, so they always agree.

**v0 operations:**

| Operation   | MCP tool (`/api/v1/mcp`)      | Web API                        | Returns                                                                                                                                    |
| ----------- | ----------------------------- | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Look up IDs | `lookup_genes(assembly, ids)` | `POST /api/v1/genes/lookup`    | for each ID given: the matching genes and how each matched, or not found; up to a whole counts table (about 7,000 IDs for P01) in one call |
| One gene    | `get_gene(gene_uid)`          | `GET /api/v1/genes/<gene_uid>` | everything the page shows, or not found                                                                                                    |

In v0, IDs are matched against the assembly's latest genes.

**v1 adds two optional parameters:**

- **`gtf_md5` on lookup:** IDs are matched against that GTF's genes (`gtf_gene_map`), the answer names the annotation set version the GTF holds, and each gene comes back as that annotation described it, with a pinned link and a flag if the gene has changed since. An `md5` BRC hasn't seen is reported as unknown, and the IDs are then matched as in v0. Without it, the answer says the GTF wasn't checked.
- **`annotation` on one gene** (`get_gene(gene_uid, annotation)`, `GET /api/v1/genes/<gene_uid>?annotation=<id>`): the gene as that annotation set version described it.

**Gene, as the API returns it** (changes from the stub's `GeneRecord` in `packages/shared/services/genes/types.ts` in brackets):

| Field                                                                                                                | Example                                                                                                                 |
| -------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `geneUid`                                                                                                            | UUID [was a slug]                                                                                                       |
| `geneId`                                                                                                             | `PVP01_0910200`                                                                                                         |
| `assemblyAccession`, `organism`                                                                                      | `GCA_900093555.2`, _Plasmodium vivax_ P01                                                                               |
| `product`                                                                                                            | "essential nuclear protein 1, putative"                                                                                 |
| `biotype`                                                                                                            | `protein_coding` [new]                                                                                                  |
| `proteinAccession`                                                                                                   | `VUZ95756.1` [new]                                                                                                      |
| `location`: `seqName`, `start`, `end`, `strand`                                                                      | [was one display string]                                                                                                |
| `symbol`                                                                                                             | null for P01 [now optional]                                                                                             |
| `aliases`: `value`, `type`, `current`, `publisher`, `via`                                                            | [was a list of strings]; `via` is empty for the publisher's own IDs and `ucsc` for IDs taken from UCSC's copy (from v1) |
| `provenance`: publisher, provider, release label, release date, genes as of, retrieved at, annotation set version ID | [replaces `publisher` and `release`]                                                                                    |
| `predicted`                                                                                                          | [dropped: predictions are out of v1]                                                                                    |

**Every response carries `snapshot`,** the build ID of the snapshot it was read from (R3). The download carries it on every row.

**Lookup result:** for each ID given, the matching genes (usually one; several when the ID is ambiguous, such as a symbol two genes share or, from v1, a GTF `gene_id` that covers several genes) or not found, and how each matched (`gene_id`, `protein_accession`, `transcript_id`, `symbol`, `ncbi_gene_id`; from v1 `gtf_transcript_id`; later `previous_id`). [Was one gene and `matchedAlias`.]

**After v0:** a gene table download per assembly (`GET /api/v1/genes/download?assembly=<accession>`, tab-separated, with the annotation set version, retrieval date and snapshot build ID on every row). By default it is built on request and cached for each snapshot; how to build it is decided when it is built.

**Later:** `search_genes` for free-text and prefix search; cursor paging; the on-site assistant's own gene tools.

## 7. Gene history

v0 and v1 keep each annotation version side by side. From v1 they can tell whether a gene's record differs between two versions, which is all the "changed since" banner and flag need (sections 1 and 6), but they don't classify what happened; that is the change history, which comes after v1. Until then, a gene that is in an older annotation but not the latest keeps its page, showing the gene as last seen, with a notice "not in the latest annotation (publisher, genes as of …)". Whether it was merged, split or retired waits for the change history. The terms are fixed now so the first recorded update needs no redesign.

- **Changes,** recorded at each update with the date we saw them: new; modified (same ID, changed gene model); renamed (a publisher gene with a different ID becomes canonical); merged into another gene; split into several genes; retired (gone from the publisher's release).
- **Status shown on a page:** current, which includes modified and renamed genes; merged, with the gene it merged into; split, with the genes it split into; retired, with the release it was last seen in; or removed from the catalog, which means we dropped the assembly or publisher and says nothing about the gene upstream.
- **Pages of genes that are no longer current stay:** each shows the gene as last seen, with a notice saying what happened and linking to the gene it merged into or the genes it split into. Nothing redirects silently.
- **Links between publisher genes say where they came from:** `declared` (the publisher states it: `old_locus_tag`, VEuPathDB's `GeneAliases.txt`, NCBI's `gene_history`) or `inferred`, with the rule that made it (e.g. position overlap). Only declared links are used until an inference rule is reviewed. A declared link can still be wrong: 3D7's SPP (`PF3D7_1440200`) declares as its `old_locus_tag` the current locus tag of a different gene, PBGS (`PF3D7_1440300`), left over from an NCBI merge PlasmoDB never made (`gene-history-findings.md`; see Open decisions).
- **Past history can be filled in** for VEuPathDB organisms. VEuPathDB keeps every release's GFF3 back to release 24 (P01's from release 29), and a previous-ID file (`GeneAliases.txt`) for 227 of its 830 organisms; without one, a gene can only be shown as gone or overlapping another. A test on 3D7, comparing releases 24 and 71 with release 71's previous-ID file, found that VEuPathDB's stated successors and position overlap agree wherever both could be checked (`gene-history-findings.md`).
- **Across assembly versions** (later), a gene page links to the same gene on the newer assembly version: "a newer version of this gene is on `GCA_x.3`". The evidence, strongest first:
  1. The same publisher gene ID on both versions (`declared`). This holds only where the publisher didn't rename genes between the versions; how often isn't measured.
  2. The same NCBI GeneID when the locus tag changed (`declared`). 3D7 RefSeq `GCF_000002765.3` → `.6` kept 5,255 GeneIDs whose locus tags changed, most in the 2012 renaming. `old_locus_tag` holds only the previous release's tag, so it declares the changes between consecutive versions but not these.
  3. Position, on sequences that didn't change (`inferred`). A new assembly version has a new genome digest, but most of its sequence digests can be unchanged. Where a sequence's digest is the same on both versions, positions carry over exactly. Genes on changed sequences need an alignment first.

## Open decisions

- [ ] **v0's size.** The gene list prototype's inventory (2026-09-28) counts 2,412 catalog assemblies with an NCBI annotation (1,394 RefSeq, 1,018 GenBank) and about 17.9 million genes, a median of 5,425 per assembly. So v0 means about 18 million gene pages and `gene_uid`s. The GFF3s are sized (about 4 GB gzipped, section 4). Still to size: the snapshot file, how long a full update and build take on a developer machine, and how much memory DuckDB's key indexes need while they run. Needed before v0 extends past P01.
- [ ] **Reading a run's GTF `md5` back from Galaxy** (v1). BRC sends it at launch. The schema doc records that it can be read back through the run's landing request (checked 2026-10-14 on an older run); a run launched since 2026-01-14, when BRC started sending it, is still to confirm. Where Galaxy doesn't expose it, the app or user computes the `md5` of the run's GTF; BRC matches it whether the file is compressed or not (section 2).
- [ ] **`gene-sources.yml` written by hand or generated.** v0's entries could be generated from the catalog (every assembly with an NCBI GFF3) and v1's GTF entries from running the check in section 5, then reviewed in the PR.
- [ ] **VEuPathDB's terms.** Access isn't a blocker: we have an API key, and a production one is easy to get. Whether we may republish VEuPathDB's data, keep archived copies, and how to credit it is #1894 (check VEuPathDB's terms for republishing its data). Needed before VEuPathDB publisher genes, not for v0 or v1.
- [ ] **Publisher precedence** for the canonical record (VEuPathDB, RefSeq, GenBank?). Not needed for v1.
- [ ] **One `gene_uid` per assembly version, or one across versions.** This contract gives each assembly version its own genes (R7), linked by "a newer version of this gene is on …". The alternative is one `gene_uid` across assembly versions, with the plain address showing the latest assembly. Separate is simpler and matches how runs work (one assembly each); one across versions gives a single address for a gene, but needs the cross-assembly match decided when the `gene_uid` is minted. Needed before any catalog assembly gets a new version.
- [ ] **GenBank/RefSeq pairs:** which pairs count as one assembly version (3D7's `GCF_000002765.5` and `.6` both pair with `GCA_000002765.3`). Not needed for v1.
- [ ] **Whose AWS account holds the gene data store,** and whether snapshots are public or read with a read-only key. The project should own it, not a person, so that moving it later (to Jetstream, with help from whoever runs that storage) is easy. Before a move: check that the new store supports versioning and object lock. Needed before the first update is committed.
- [ ] **DuckLake or our own manifests.** DuckLake, DuckDB's table format over Parquet in object storage, provides the manifests, head, commit check, schema changes and compaction, but keeps its catalog in a small database of its own. Our own manifests are about a page of code. Neither enforces keys (DuckLake doesn't support primary or foreign keys), so either way an update is written through a local DuckDB file (section 4). Either has to meet section 4. Needed before step 1 is built.
- [ ] **The stub's gene shape** changes as in section 6. OK with the front end?
- [ ] **A declared old ID that names another current gene.** 3D7's SPP (`PF3D7_1440200`) has `old_locus_tag` `PF3D7_1440300`, PBGS's current locus tag; the two were never one gene (`gene-history-findings.md`). Until decided, such a value is kept as an ID that finds the gene, labelled as a former ID, and search lists both genes with the current one first, but it is not a link: no merged or split status is drawn from it. The options are to keep that, to drop the value, or to reject the annotation set version. 1 such value in 3D7. Needed before the change history uses `old_locus_tag`.

## Done when

- [ ] Reviewed by the backend and front-end owners
- [ ] This contract and its design documents are merged
- [ ] Each v0 and v1 build issue names the section it implements
