# Gene Catalog: v1 Design Contract

> **Draft, under review.** This contract will be updated as we implement it and it meets reality. It is a general guide: it records our decisions and informs the coding agent that builds against it. Discussion is on #1892 (gene catalog: v1 design contract).

Part of #1776 (gene pages umbrella). This contract fixes the interfaces the build issues implement: how genes are identified, what every answer says about where it came from, what a snapshot of the gene data holds, how it is published and served, and what the API returns. Each build issue names the section it implements.

It was informed and inspired by #1783 (gene catalog: serving architecture, by @dannon), which it replaces. What carries over, and what changes, is listed at the end. The reasoning and evidence behind it are in the documents beside it: [gene-provenance-spec.md](gene-provenance-spec.md) for requirements, [gene-annotation-schema.md](gene-annotation-schema.md) for tables, and [gene-history-findings.md](gene-history-findings.md) for rebuilding past gene history.

## What this is for

Two bets drive the design. Most of what is heavier than a plain gene lookup traces to one of them; the rest (R7–R11) would be needed anyway.

1. **Knowing exactly which GTF a workflow used matters,** because GTF files change with no outside sign.
2. **Showing a gene's lineage matters,** because papers and older results use gene IDs that publishers have since renamed, merged or retired.

### Use cases

"My results" means the output of a workflow run in Galaxy, launched from BRC: for example the counts table from an RNA-seq run. Output from any tool can be looked up by gene ID, but a Galaxy run launched from BRC also keeps the exact GTF it used, as a dataset in the run's history, and BRC sends Galaxy that GTF's `md5` at launch. That is what bet 1 builds on.

v0 builds each use case marked v0 on _P. vivax_ P01 alone; v1 extends the same use cases to every catalog assembly whose GTF matches NCBI's annotation (see Scope).

| Use case                                                        | Example                                                                                                                                                                                                                                                                      | Bet | When                                                  |
| --------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --- | ----------------------------------------------------- |
| **Name the genes in my Galaxy results**                         | The counts table from a P01 RNA-seq run in Galaxy lists `PVP01_0910200`; each row gets its product name, as the run's annotation described it, and a link to the gene as that annotation described it                                                                        | —   | v0                                                    |
| **Tell me about a gene**                                        | The page shows product name, location, protein accession and where they come from                                                                                                                                                                                            | —   | v0                                                    |
| **Which annotation did my Galaxy run use?**                     | The run's GTF `md5`, sent to Galaxy when BRC launched it, leads to "NCBI GenBank's annotation of `GCA_900093555.2`, genes as of 2020-06-17"; a GTF BRC has never seen is reported as unknown                                                                                 | 1   | v0                                                    |
| **An AI app labels my Galaxy results**                          | An AI app reads a counts table and its GTF's `md5` from a Galaxy history, and labels the table in one call to BRC's MCP server                                                                                                                                               | 1   | v0                                                    |
| **What was this gene in my run, and is there a newer version?** | A gene link from a P01 run opens the gene as the run's annotation described it. If a newer annotation of the same assembly changed the gene, a banner says so ("changed in a newer NCBI annotation, genes as of …: see the latest"), so you can decide whether to re-analyse | 1   | v0; the banner appears once a newer annotation exists |
| **Why does BRC differ from the publisher?**                     | BRC shows VEuPathDB release 68 while VEuPathDB is on 71                                                                                                                                                                                                                      | 1   | Later                                                 |
| **An old ID finds the current gene**                            | `PF11_0344` from a paper leads to AMA1's page: "previous ID, per VEuPathDB"                                                                                                                                                                                                  | 2   | Later                                                 |
| **What happened to this gene?**                                 | `PF3D7_0112400`: "retired; in VEuPathDB release 24, gone by release 71"                                                                                                                                                                                                      | 2   | Later                                                 |
| **The same gene on a newer assembly**                           | The gene's page on `GCA_x.2` says "a newer version of this gene is on `GCA_x.3`", for re-analysing on the newer assembly                                                                                                                                                     | 2   | Later                                                 |

### Key requirements

"When" is the first build that has the requirement; v1 keeps everything v0 has.

| #   | Requirement                                                                                                                                                                                                                                                     | Why                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | When                                        | Section |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------- | ------- |
| R1  | A GTF leads to the exact annotation it holds by its `md5`, never by its name, URL or release label                                                                                                                                                              | GTFs change silently. NCBI changed P01's genes on 2020-06-17 and still dates the annotation 2019-08-01. UCSC rewrites GTFs in place, and none of the catalog's 2,031 UCSC `ncbiGene` tracks has a release label. 321 of the catalog's 2,419 UCSC GTFs copied from NCBI (13%) were built before NCBI last changed the genes' locations, a median of 179 days before; 306 of them are bacteria (#1874, GenArk GTFs behind NCBI's annotation). When BRC launches a workflow, it sends Galaxy the GTF's `md5` from UCSC's `md5sum.txt` where UCSC lists one, as it does for P01 | v0                                          | 2, 3, 6 |
| R2  | Every annotation file we read is kept, with its checksums and the date we read it                                                                                                                                                                               | Publishers overwrite their files. A GTF we never kept can't be recognised later (R1), and past changes can only be rebuilt from files we have                                                                                                                                                                                                                                                                                                                                                                                                                               | v0                                          | 2, 4    |
| R3  | Every answer names the annotation it comes from, and which build of BRC's gene data it was read from                                                                                                                                                            | A result can be explained and cited, and an answer that changes can be traced                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | v0                                          | 2, 6    |
| R4  | A gene's page address never changes and its page is never removed: not through renames, merges or splits, nor when a different publisher's description becomes the one shown. A pinned address (one annotation's view of the gene) keeps showing the same thing | Links in results, downloads, saved lists and papers keep working, and a link from a run keeps showing the gene as the run's annotation described it                                                                                                                                                                                                                                                                                                                                                                                                                         | v0 for the addresses; later for the changes | 1       |
| R5  | Every ID a gene has had finds it, labelled with who stated it                                                                                                                                                                                                   | AMA1 was `PF11_0344` before 2012. 285 _P. falciparum_ 3D7 gene IDs in VEuPathDB release 24 are gone by release 71                                                                                                                                                                                                                                                                                                                                                                                                                                                           | Later; v0 and v1 find current IDs only      | 1, 3, 7 |
| R6  | Changes to a gene are recorded each time we update from the publishers, with the date seen. What a publisher states is kept apart from what we infer                                                                                                            | Our copies of the files keep what publishers said; only our records keep what we concluded from them, such as which publisher genes form one gene, and page addresses depend on that. Inferences can be wrong, so each must be traceable to its rule and removable                                                                                                                                                                                                                                                                                                          | Later, with the change history              | 7       |
| R7  | A gene page belongs to one assembly version. The same gene ID on a newer assembly version gets its own page, linked to the old one (see Open decisions)                                                                                                         | A location, a gene model and a workflow's GTF each refer to one assembly version; a page spanning versions would have to label every fact with its version                                                                                                                                                                                                                                                                                                                                                                                                                  | v0                                          | 1       |
| R8  | The page, search box (ID lookup), download and MCP tools give the same answer                                                                                                                                                                                   | They all call one service reading the same data                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | v0                                          | 6       |
| R9  | A whole counts table is labelled in one call                                                                                                                                                                                                                    | About 7,000 gene IDs for P01 (6,836 in its GTF); larger genomes have more                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | v0                                          | 6       |
| R10 | Gene data is updated, and rolled back, without a site deploy                                                                                                                                                                                                    | Publishers release on their own schedules                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | v0, with an API restart                     | 5       |
| R11 | Adding an assembly is a source-list entry, not code                                                                                                                                                                                                             | v1 covers every assembly that qualifies, and new ones join the catalog over time                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | v1                                          | 4, 5    |

### If a bet is wrong

Without bet 1, R1 shrinks to "serve the current GTF", R2 is needed only for bet 2's history, and sections 2–4 get much simpler. Without bet 2, R5, R6 and section 7 go, and R4 shrinks to keeping a page's address when a different publisher's description becomes the one shown. v0 builds a small part of each, enough to test both on P01.

## Scope

**v0, the walkthrough:** _P. vivax_ P01 (`GCA_900093555.2`), NCBI GenBank's annotation (submitted by WTSI). A researcher runs RNA-seq on P01 in Galaxy from BRC, and every gene in the results has a product name and a gene page that says which annotation the run used (see #1776). v0 covers runs on P01's UCSC `ncbiGene` GTF; runs on its `veupathGenes` GTF (VEuPathDB release 68) come later. It proves every section end to end on one assembly.

**v1:** every catalog assembly whose UCSC `ncbiGene` or `ncbiRefSeq` GTF matches NCBI's current annotation: the same core hash and the same gene IDs as NCBI's GFF3, the check P01 passes. The publisher is NCBI GenBank or NCBI RefSeq. Adding an assembly is an entry in `gene-sources.yml` and passing the publish checks; nothing in the design is specific to P01. Each gene page shows what the NCBI file has, so symbols and NCBI GeneIDs appear where the file carries them, as RefSeq files usually do. How many assemblies qualify isn't measured yet. The 321 UCSC GTFs built before NCBI's last change (R1) are likely to fail the check, and wait.

The contract is written for more than v1, so later publishers and assemblies add rows, not redesigns. What v0 and v1 build of each section is marked **v0** or **v1**.

**Later:** VEuPathDB as a publisher (which brings _P. falciparum_ 3D7's current genes), GTFs that don't match NCBI, previous IDs, gene history on pages, site-wide search, the on-site assistant's gene tools, genes predicted by software rather than published (UCSC's augustus and xenoRefGene tracks).

## Terms

**Where genes come from**

- **Publisher:** who states the genes in an annotation file: NCBI RefSeq, NCBI GenBank (the annotation the submitting lab deposited) or VEuPathDB. UCSC isn't a publisher: its GTFs are copies of a publisher's annotation.
- **Provider:** the lab or pipeline that made the annotation, as the publisher names it, e.g. WTSI (Wellcome Sanger Institute) for P01's GenBank annotation.
- **Release label:** the publisher's own name for a release, verbatim: "release 68", `RS_2026_09`. NCBI GenBank annotations have none; NCBI names them by provider and date, e.g. "Annotation submitted by WTSI", 2019-08-01.
- **Annotation set:** one publisher's annotation of one assembly version, across all its releases, e.g. NCBI GenBank's annotation of `GCA_900093555.2`.
- **Annotation set version:** one state of an annotation set's genes. A new release label makes a new version, and so do changed genes under the same label. A file rewritten with the same genes doesn't.
- **Annotation file version:** one exact GFF3 or GTF file, identified by its bytes (`sha256`, `md5`): the publisher's original or a UCSC copy. Several annotation file versions can hold the same annotation set version.
- **Core hash:** a fingerprint of an annotation file's coding sequences (each one's sequence name, strand, start and end), leaving out IDs and names. A UCSC copy has the same core hash as its publisher's original when they hold the same coding sequences.

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
- **Sequence-name map:** an assembly's publisher sequence names mapped to the names UCSC uses. P01 needs none: NCBI's GFF3 and UCSC's GTF both use GenBank accessions (`FLZR02000001.1`).

**Serving**

- **Snapshot:** one build of all the gene data, as a single file that is never edited. The **live** snapshot is the one the API serves; a new snapshot's **parent** is the one that was live when it was built.
- **Change history:** the insert-only record of what each update from the publishers found (the schema doc's write model). Snapshots are rebuilt from it once it exists, a fast follow.
- **Provenance line:** the line under a gene's name saying which annotation it comes from.
- **Pinned address:** a gene's address plus an annotation set version, showing the gene as that annotation described it rather than its latest state (section 1).

## 1. Identity

- **A gene is identified by `gene_uid`,** a random UUID minted once and never reused. Gene IDs, symbols and accessions are names that find a gene, not its identity, because publishers rename, merge and split genes.
- **Page address:** `/data/genes/<gene_uid>` shows the gene's latest state. The pinned address `/data/genes/<gene_uid>?annotation=<annotation set version ID>` shows the gene as that annotation described it, with a banner naming the annotation and its date. If a newer annotation of the same assembly changed the gene, the banner says so and links to the latest state, so someone with results from the older annotation can decide whether to re-analyse; later, it also links to the gene on a newer assembly version (section 7). The version in a pinned address is always an annotation, never a gene version number. The stub detail page (#1814, stub gene detail page PR) is at `/data/genes/detail?uid=` with readable slugs (`pf3d7-1133400`); v0 adds a web server rule for the path form, and the slugs become UUIDs.
- **Publisher genes are keyed by annotation set and publisher gene ID.** This is #1783's `(assembly, source, gene_id)` key. The key stays the same across releases; each release that changes the gene adds a record under it.
- **A gene groups publisher genes** on one assembly version that share a locus tag or that a publisher links. _P. falciparum_ 3D7's AMA1 groups three publisher genes, all with gene ID `PF3D7_1133400`. Their latest records:

  | Record | Publisher and release           | Adds                                    |
  | ------ | ------------------------------- | --------------------------------------- |
  | A      | VEuPathDB (PlasmoDB) release 71 | symbol `AMA1`, previous ID `PF11_0344`  |
  | B      | NCBI RefSeq `RS_2026_09`        | NCBI GeneID `810891`, RefSeq accessions |
  | C      | NCBI GenBank                    | the submitting lab's protein accession  |

  They are one gene with one page, so `810891` and `PF11_0344` lead to the same page. RefSeq's record is on a `GCF_` accession, so it joins the others only if NCBI pairs that accession with the GenBank one as identical (see Assembly version).

- **The canonical record is chosen by a fixed publisher order,** still to be decided (see Open decisions). One record has to win because records can disagree on location, product and gene model. In v0 and v1 each assembly has one publisher, so each gene has one publisher gene, and its latest record is canonical.
- **A gene changes; its `gene_uid` doesn't.** The changes are listed in section 7. Each is recorded in the change history with the date we saw it and a version number. Users see dates and annotations, never the number, which is for internal use. The plain address always shows the latest state; earlier states are reached through pinned addresses.
- **Each assembly version has its own genes.** Genes on `GCA_x.3` get new `gene_uid`s and pages, and the pages for `GCA_x.2` stay, with the assembly marked "previous". A location only means something on one assembly, and a workflow runs against one exact assembly. Section 7 covers linking a gene to the same gene on a newer assembly version.
- **`gene_uid`s are kept outside the snapshot,** in the backend's Postgres (publisher gene key → `gene_uid`), so a rebuild never changes a page address. Each build reads that list and adds to it.

## 2. Provenance

Every answer (page, API response, MCP tool result, download row) names the **annotation set version** it comes from. Every API response and download row also names the **snapshot** it was read from.

- **Each annotation set version records** its assembly, publisher, provider and release label; where known, its release date and the date its genes last changed ("genes as of"; NCBI gives it in `annotation_hashes.txt`); and the publisher's file its genes were read from. NCBI changed P01's genes on 2020-06-17 but still dates the annotation 2019-08-01, so one date covers two sets of genes. We have seen only the later one.
- **Each annotation file version records** its URL, `sha256`, `md5` (of the bytes as served, gzipped if the file is), retrieval time, our archived copy, and the annotation set version it holds. Publishers overwrite their files, so we keep every file we read from day one.
- **A UCSC copy is tied to an annotation set version by its genes,** not its name or date: its core hash and gene IDs must match the publisher's file. P01's UCSC `ncbiGene` GTF matches NCBI's GFF3 across all 6,683 protein-coding genes. That isn't a full match: UCSC's P01 GTF splits every multi-exon gene into one-exon transcripts, so gene counts are right but transcript-level results aren't. The download link carries a note saying so. The same split affects at least one gene in 534 of the catalog's 2,031 `ncbiGene` assemblies, so in v1 the note appears wherever the build finds a split.
- **A workflow's GTF leads to its annotation set version** by its `md5`: `annotation_file` gives the version, and `gtf_gene_map` gives each GTF gene's `gene_uid`. Links from a run are pinned to that version. A GTF whose `md5` we haven't seen is reported as unknown, never guessed.
- **Old mappings are never dropped.** When a publisher or UCSC rewrites a GTF in place, the new bytes get a new `md5` and new `gtf_gene_map` rows; the old `md5`'s rows stay, so a run on the old file still resolves to the annotation it used. If the new annotation drops a gene, the old mapping still leads to its page, which says it isn't in the latest annotation (and, once the change history exists, whether it was merged, split or retired).
- **The provenance line** reads, for P01: "From NCBI GenBank's annotation of `GCA_900093555.2` (submitted by WTSI, 2019-08-01; genes as of 2020-06-17), retrieved …". "Retrieved" is when we fetched the publisher's file the genes were read from.

## 3. Snapshot contents

A snapshot is one DuckDB file, `genes-<build>.duckdb`.

**v0 tables** (v1 adds rows, not tables). The snapshot keeps every annotation set version we have read, forever, not just the latest, so old GTFs and pinned addresses always resolve and every gene page always shows the gene; gene rows carry the annotation set version they come from.

| Table                    | One row per                         | Holds                                                                                                                                                                                                                                 |
| ------------------------ | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `annotation_set_version` | annotation set version              | assembly, publisher, provider, release label, release date and genes-as-of date where known, the publisher's file its genes were read from, the date we first saw it                                                                  |
| `annotation_file`        | annotation file version             | URL, `sha256`, `md5`, retrieval time, archived copy, the annotation set version it holds                                                                                                                                              |
| `transcript`             | transcript × annotation set version | `gene_uid`, gene ID, transcript ID, protein accession, location (sequence name, start, end, strand), product, biotype. P01's GFF3 has no mRNA rows, so P01 has one transcript per gene, with an ID BRC makes                          |
| `alt_id`                 | ID × gene                           | every ID that finds a gene, with its type, who states it, and whether it is current or historical: protein accessions, transcript IDs in UCSC's GTF (`VUZ95756.1_2`), symbols and GeneIDs where the file has them; later previous IDs |
| `gtf_gene_map`           | GTF file version × GTF gene × gene  | GTF `md5`, GTF `gene_id` → `gene_uid`; a GTF `gene_id` that covers several genes gets a row per gene. Rows for every GTF file version we have read, never dropped                                                                     |
| `snapshot`               | snapshot (one row)                  | build ID, `schema_version`, parent snapshot, build time, the commits of `gene-sources.yml` and the build code                                                                                                                         |

Sequence names are the ones UCSC's genome browser uses for the assembly, so a location opens there as given. Where a publisher's names differ, the build converts them with the sequence-name map.

**Later tables:** `gene_change` (new, modified, renamed, merged, split, retired, each with its date and release), and one table per data type (e.g. protein domains).

## 4. Build inputs

- **A source list in the repo,** `catalog/source/gene-sources.yml`, says which publisher and release apply to each assembly, and which GTFs map to it. Changing it is a PR. **v0:** one entry, P01 with NCBI GenBank and UCSC's `ncbiGene` GTF. **v1:** one entry per qualifying assembly (see Scope).
- **Every input file is archived** with `sha256`, `md5` and fetch date before it's read.
- **v1: cached build files** per assembly, publisher and release, rebuilt only when an input file, the build code or the sequence-name map changes, so adding one assembly doesn't rebuild the rest. v0 has one assembly, so it builds everything each time.

## 5. Publishing and serving

- **One mounted directory,** `/opt/brc-analytics-data/genes/`, read-only in the API container, holding the snapshots and a relative `current.duckdb` symlink to the live one. A directory, not a file, because a single-file mount keeps the old file until the container is recreated.
- **Publish:** copy the snapshot in, run the checks on the host, replace the symlink atomically, restart the API. **Rollback:** point the symlink back and restart the API; the checks don't apply to a rollback. Keep the last few snapshots.
- **Checks before publishing** refuse a snapshot that:
  - is missing an assembly and publisher listed in `gene-sources.yml`;
  - loses or changes more than a set share of genes or IDs compared with its parent, unless `gene-sources.yml` marks the change as expected;
  - was built against a parent that is no longer live;
  - has a `schema_version` the deployed backend doesn't read;
  - doesn't map every gene ID in each GTF listed in `gene-sources.yml` to a gene (6,836 for P01);
  - (**v1**) includes an assembly whose GTF doesn't match NCBI's GFF3 on core hash and gene IDs.
- **Schema changes go backend first:** a backend release learns to read version N+1 while still reading N, and only then is an N+1 snapshot published.
- **The backend refuses to start** if `current.duckdb` is missing, with a clear error. The MCP gene tools are always on; the pages are behind the `gene-pages` flag.
- **Later:** picking up a new snapshot without a restart.

## 6. API

**One backend service** (`GeneCatalogService`) answers every gene question. The MCP tools, web API, gene page and search box all call it, so they always agree.

**v0 operations** (the same in v1, for any assembly in the snapshot):

| Operation   | MCP tool (`/api/v1/mcp`)                | Web API                                           | Returns                                                                                                                                    |
| ----------- | --------------------------------------- | ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Look up IDs | `lookup_genes(assembly, ids, gtf_md5?)` | `POST /api/v1/genes/lookup`                       | for each ID given: the matching genes and how each matched, or not found; up to a whole counts table (about 7,000 IDs for P01) in one call |
| One gene    | `get_gene(gene_uid, annotation?)`       | `GET /api/v1/genes/<gene_uid>?annotation=<id>`    | everything the page shows, for the latest state or the given annotation set version, or not found                                          |
| Gene table  | (none)                                  | `GET /api/v1/genes/download?assembly=<accession>` | tab-separated table, with the annotation set version, retrieval date and snapshot build ID on every row                                    |

**The GTF's `md5` is optional.** With it, IDs are matched against that GTF's genes (`gtf_gene_map`), the answer names the annotation set version the GTF holds, and each gene comes back as that annotation described it, with a pinned link and a flag if the gene has changed since. An `md5` BRC hasn't seen is reported as unknown, and the IDs are then matched as if none were given. Without it, IDs are matched against the assembly's latest genes, and the answer says the GTF wasn't checked.

**Gene, as the API returns it** (changes from the stub's `GeneRecord` in `packages/shared/services/genes/types.ts` in brackets):

| Field                                                                                                                | Example                                   |
| -------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| `geneUid`                                                                                                            | UUID [was a slug]                         |
| `geneId`                                                                                                             | `PVP01_0910200`                           |
| `assemblyAccession`, `organism`                                                                                      | `GCA_900093555.2`, _Plasmodium vivax_ P01 |
| `product`                                                                                                            | "essential nuclear protein 1, putative"   |
| `biotype`                                                                                                            | `protein_coding` [new]                    |
| `proteinAccession`                                                                                                   | `VUZ95756.1` [new]                        |
| `location`: `seqName`, `start`, `end`, `strand`                                                                      | [was one display string]                  |
| `symbol`                                                                                                             | null for P01 [now optional]               |
| `aliases`: `value`, `type`, `current`, `publisher`                                                                   | [was a list of strings]                   |
| `provenance`: publisher, provider, release label, release date, genes as of, retrieved at, annotation set version ID | [replaces `publisher` and `release`]      |
| `predicted`                                                                                                          | [dropped: predictions are out of v1]      |

**Every response** names the snapshot it was read from (its build ID).

**Lookup result:** for each ID given, the matching genes (usually one; several when the ID is ambiguous, such as a GTF `gene_id` that covers several genes or a symbol two genes share) or not found, and how each matched (`gene_id`, `protein_accession`, `ucsc_transcript_id`, `symbol`, `ncbi_gene_id`; later `previous_id`). [Was one gene and `matchedAlias`.]

**Later:** `search_genes` for free-text and prefix search; cursor paging; the on-site assistant's own gene tools.

## 7. Gene history

v0 and v1 keep each annotation version side by side, but don't work out what changed between them; that is the change history, which comes after v1. Until then, a gene that is in an older annotation but not the latest keeps its page, showing the gene as last seen, with a notice "not in the latest annotation (publisher, genes as of …)". Whether it was merged, split or retired waits for the change history. The terms are fixed now so the first recorded update needs no redesign.

- **Changes,** recorded at each update with the date we saw them: new; modified (same ID, changed gene model); renamed (a publisher gene with a different ID becomes canonical); merged into another gene; split into several genes; retired (gone from the publisher's release).
- **Status shown on a page:** current, which includes modified and renamed genes; merged, with the gene it merged into; split, with the genes it split into; retired, with the release it was last seen in; or removed from the catalog, which means we dropped the assembly or publisher and says nothing about the gene upstream.
- **Pages of genes that are no longer current stay:** each shows the gene as last seen, with a notice saying what happened and linking to the gene it merged into or the genes it split into. Nothing redirects silently.
- **Links between publisher genes say where they came from:** `declared` (the publisher states it: `old_locus_tag`, VEuPathDB's `GeneAliases.txt`, NCBI's `gene_history`) or `inferred`, with the rule that made it (e.g. position overlap). Only declared links are used until an inference rule is reviewed.
- **Past history can be filled in** for VEuPathDB organisms. VEuPathDB keeps every release's GFF3 back to release 24 (P01's from release 29), and a previous-ID file (`GeneAliases.txt`) for 227 of its 830 organisms; without one, a gene can only be shown as gone or overlapping another. A test on 3D7, comparing releases 24 and 71 with release 71's previous-ID file, found that VEuPathDB's stated successors and position overlap agree wherever both could be checked (`gene-history-findings.md`).
- **Across assembly versions** (later), a gene page links to the same gene on the newer assembly version: "a newer version of this gene is on `GCA_x.3`". The evidence, strongest first:
  1. The same publisher gene ID on both versions (`declared`). This holds only where the publisher didn't rename genes between the versions; how often isn't measured.
  2. The same NCBI GeneID when the locus tag changed (`declared`). 3D7 RefSeq `GCF_000002765.3` → `.6` kept 5,255 GeneIDs whose locus tags changed, most in the 2012 renaming. `old_locus_tag` holds only the previous release's tag, so it declares the changes between consecutive versions but not these.
  3. Position, on sequences that didn't change (`inferred`). A new assembly version has a new genome digest, but most of its sequence digests can be unchanged. Where a sequence's digest is the same on both versions, positions carry over exactly. Genes on changed sequences need an alignment first.

## What carries over from #1783

| From #1783                                                    | Here                                                                                                                                                                           |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Snapshots that are never edited; every change makes a new one | Kept (section 3)                                                                                                                                                               |
| `gene-sources.yml`, reviewed in PRs                           | Kept (section 4)                                                                                                                                                               |
| Cached build files per assembly, source and release           | Kept, from v1 (section 4)                                                                                                                                                      |
| Checks before publishing, with "expected change" overrides    | Kept, plus checks that every GTF gene maps and that each GTF matches NCBI (section 5)                                                                                          |
| Directory mount, `current.duckdb` symlink, restart, rollback  | Kept (section 5)                                                                                                                                                               |
| Backend-first schema versions                                 | Kept (section 5)                                                                                                                                                               |
| One service behind REST, MCP and the assistant                | Kept (section 6). The assistant's tools come after v1                                                                                                                          |
| Gene key `(assembly, source, gene_id)`                        | Becomes the publisher gene key; `gene_uid` groups publisher genes (section 1)                                                                                                  |
| Which publisher a page leads with is a display choice         | Becomes publisher precedence for the canonical record (section 1)                                                                                                              |
| MCP tools `get_gene`, `search_genes`                          | `get_gene` kept; `lookup_genes` added for whole tables, with an optional GTF `md5`; `search_genes` later (section 6)                                                           |
| `gene_history` diffed from the parent snapshot                | The same kinds of change (section 7), recorded in the change history at each update rather than diffed between snapshots; can also be filled in from VEuPathDB's past releases |
| Replacements only on the source's evidence                    | Kept as `declared` links (section 7)                                                                                                                                           |

## Open decisions

- [ ] **Reading a run's GTF `md5` back from Galaxy.** BRC sends it at launch. The schema doc records that it can be read back through the run's landing request (checked 2026-10-14 on an older run); a run launched since 2026-01-14, when BRC started sending it, is still to confirm. UCSC's `md5` is of the gzipped file, so if Galaxy stores the GTF uncompressed, `annotation_file` needs the uncompressed `md5` too. Blocks the two use cases that start from a run's GTF `md5` ("Which annotation did my Galaxy run use?" and "An AI app labels my Galaxy results") as written; without it, the app or user must compute the `md5` themselves.
- [ ] **The annotation set version ID in pinned addresses:** readable (`ncbi-genbank-GCA_900093555.2-2020-06-17`) or opaque (a UUID). Readable IDs say what they pin; they need a rule for two versions on the same date.
- [ ] **`gene-sources.yml` written by hand or generated.** v1's entries could be generated from the catalog by running the core-hash and gene-ID check on every UCSC GTF copied from NCBI, then reviewed in the PR.
- [ ] **VEuPathDB in production.** Reading VEuPathDB's files needs an API key. May we use one in production, under a service account or VEuPathDB's agreement? Blocks VEuPathDB publisher genes, not v1.
- [ ] **Publisher precedence** for the canonical record (VEuPathDB, RefSeq, GenBank?). Not needed for v1.
- [ ] **One `gene_uid` per assembly version, or one across versions.** This contract gives each assembly version its own genes (R7), linked by "a newer version of this gene is on …". The alternative is one `gene_uid` across assembly versions, with the plain address showing the latest assembly. Separate is simpler and matches how runs work (one assembly each); one across versions gives a single address for a gene, but needs the cross-assembly match decided when the `gene_uid` is minted. Needed before any catalog assembly gets a new version; v0 has one.
- [ ] **GenBank/RefSeq pairs:** which pairs count as one assembly version (3D7's `GCF_000002765.5` and `.6` both pair with `GCA_000002765.3`). Not needed for v1.
- [ ] **Where builds run:** CI (a record of every build) or the VM (closer to the data). Either way the build reads and adds to the `gene_uid` list in the backend's Postgres (section 1), so CI would need access to it.
- [ ] **The stub's gene shape** changes as in section 6. OK with the front end?

## Done when

- [ ] Reviewed by the backend and front-end owners
- [ ] This contract and its design documents are merged
- [ ] Each v0 and v1 build issue names the section it implements
