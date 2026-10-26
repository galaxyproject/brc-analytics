# UCSC GTFs merge genes that share a name

Checked 2026-10-15.

## The problem

UCSC's GenArk GTFs set `gene_id` to the gene symbol, or to the locus tag when a gene has no symbol, and never make it unique. When the publisher gives two or more separate genes the same symbol, the GTF lists them as one gene; their transcripts stay separate. For example, in _Rickettsia helvetica_ (`GCF_963970025.1`) both `lpdA` genes are `gene_id "lpdA"`:

- `AB1146_RS01845` at 297,306–298,685
- `AB1146_RS07020` at 1,165,933–1,167,312

NCBI's own GTF for the same annotations keeps all of these genes separate, so the merging happens in UCSC's conversion.

## Why it matters

**Gene pages.** Gene pages need one page per gene, so they can't be built from UCSC's GTF: _R. helvetica_ would get one `lpdA` page instead of two, and the same goes for every merged gene. Gene pages use NCBI's annotation instead, which was the plan anyway. Even so, a merged count row from a workflow (`lpdA`) can't be linked to a single gene page, because it covers two genes.

The BRC RNA-seq workflows (`rnaseq-pe` and `rnaseq-sr` v1.4) count reads per gene with two tools, and both treat each `gene_id` as one gene:

- **STAR GeneCounts** counts a read for a gene if it overlaps that gene and no other.
- **featureCounts** counts a read once for a gene if it overlaps any of that gene's exons. Its manual advises against this setup: "Gene names are not recommended to use for this purpose because different genes may have the same names."

So each merged gene becomes one row of counts. As a result:

- **Each copy's expression is lost.** In 90% of bacterial merges the copies encode different proteins. Reads covering the differences map to one copy only, and those reads are added together. The separate counts can't be recovered from the table, and opposite changes in two copies can cancel out.
- **Gene length is the copies' total.** featureCounts' `Length` column is the combined exon length of all copies, so any per-length normalization of the merged row uses that total.
- **One gene, several locations.** featureCounts lists every copy's `Chr`, `Start` and `End` in one row. In 1,751 of the bacterial merges, the copies are on different sequences.
- **Gene lists are short.** A bacterial assembly has a median of 22 merged `gene_id`s, each standing for two or more genes.

Reads that map equally well to two copies aren't counted by either tool with the workflows' settings, merged or not. So merging changes only the reads that are unique to one copy.

Commonly merged bacterial genes include:

| Role                 | Genes                |
| -------------------- | -------------------- |
| Translation          | `tuf`, `fusA`        |
| Central metabolism   | `lpdA`, `gap`, `pyk` |
| Fatty acid synthesis | `fabG`               |
| 5S rRNA              | `rrf`                |

The effect on real RNA-seq results has not been measured.

## How often

Sample: 1,059 of the catalog's 2,031 UCSC `ncbiGene` GTFs, and 80 of its 390 `ncbiRefSeq` GTFs.

| GTF track (sample)           | Assemblies with merges | Genes merged away                      |
| ---------------------------- | ---------------------- | -------------------------------------- |
| `ncbiGene` bacteria (211)    | 207 (98%)              | median 0.95%, max 6%                   |
| `ncbiGene` archaea (2)       | 2                      | 1.2%                                   |
| `ncbiGene` viruses (331)     | 9 (3%)                 | 1–4 genes each                         |
| `ncbiGene` eukaryotes (515)  | 31 (6%)                | median 1.0% of those affected, max 16% |
| `ncbiRefSeq` eukaryotes (80) | 23 (29%)               | median 2.2% of those affected, max 21% |

Scaled to the catalog, that is roughly:

- `ncbiGene`: 390 of 398 bacteria, 17 of 622 viruses, and 60 of 1,009 eukaryotes
- `ncbiRefSeq`: 110 of 390 eukaryotes

**Bacteria:**

- **Merges:** 5,905, covering 13,942 genes. 86% join exactly two genes.
- **Copies:**
  - 90% encode different proteins.
  - 4% encode identical proteins.
  - 6% are noncoding, mostly `rrf`.
- **Not caused by UCSC lagging NCBI:** merges appear in 53 of 56 assemblies where UCSC is up to date and in 154 of 155 where it lags.
- **No merges in 4 of 211:**
  - _E. coli_ K-12 (`GCF_000005845.2`), whose curated names include `tufA`/`tufB`
  - _M. tuberculosis_ H37Rv (`GCF_000195955.2`)
  - _C. burnetii_ RSA 493 (`GCF_000007765.2`)
  - _K. pneumoniae_ `GCF_000240185.1`

**Viruses:** genes that are present twice in repeated regions:

- herpes simplex 1: `RS1`, `RL1`, `RL2`, `LAT`
- cercopithecine herpesvirus 1: `RS1`, `RL2`
- mpox: `OPG001`–`OPG003`, `OPG015`
- roseolovirus: `DR1`, `DR6`

**Eukaryotes with the most merging:**

| Assembly          | Species                                | Genes merged away | Cause                                                                        |
| ----------------- | -------------------------------------- | ----------------- | ---------------------------------------------------------------------------- |
| `GCA_000803305.1` | _Toxocara canis_                       | 2,915 (16%)       | Submitter reused _C. elegans_ names (`cut-1`, `col-155`)                     |
| `GCA_002087875.1` | _Hepatospora eriocheir_                | 233 (7.6%)        | Repeated symbols (`TCB1`, `MCM3`)                                            |
| `GCF_001189475.1` | _Candidozyma auris_ (`ncbiRefSeq`)     | 695 (8.4%)        | 695 frameshifted genes have the symbol "hypothetical protein" in NCBI's GFF3 |
| Six assemblies    | Ticks (`ncbiRefSeq`)                   | 7–21%             | tRNA genes, one symbol per anticodon                                         |
| `GCA_001700775.1` | _Cladophialophora carrionii_           | 379 (3.4%)        | Repeated symbols (`fabG`, `TOXA`)                                            |
| `GCA_003543875.1` | _Trypanosoma brucei_                   | 180 (2.3%)        | Repeated symbols (`PPIase`, `TEF1`)                                          |
| `GCF_001839685.1` | _Tritrichomonas foetus_ (`ncbiRefSeq`) | 576 (2.3%)        | Repeated symbols (`pkbA`, `HTB1`)                                            |
| 4 WTSI assemblies | _Plasmodium berghei_                   | 0.9–1.2%          | 19–20 `ApiAP2` genes and 15–24 `Pb235` genes share one `gene_id` each        |

Other eukaryotes lose only tRNA genes: mosquitoes 1.9–3.4%, and fungi annotated by TU Munich 1.0–1.4%.

## Method

1. **Matching:** each UCSC transcript was matched to the NCBI GFF3 gene it overlaps best, measured as overlap over combined span (Jaccard), on the same sequence and strand.
2. **What counts as a merge:** a UCSC `gene_id` whose transcripts match two or more NCBI genes, with different locus tags, that all carry that symbol.
3. **Excluded,** so the counts are a lower bound:
   - candidates whose NCBI symbols differ: 710 in `ncbiGene`, 134 in `ncbiRefSeq`
   - genes NCBI lists twice under one locus tag: 11,722 in _Vitrella brassicaformis_
4. **Checked against NCBI:** each merged gene was looked up in NCBI's `*_genomic.gtf.gz` by its coordinates.
5. **Failures:** 2 `ncbiGene` assemblies failed with NCBI 404 errors, and 1 `ncbiRefSeq` assembly has no NCBI GTF.

## Claims and evidence

| #   | Claim                                                                                             | Evidence                                                                                                                                                                                                                                               |
| --- | ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | UCSC's `gene_id` is the symbol, else the locus tag                                                | `genePredToGtf.c` writes `gene_id` = `name2` when not empty; `gene_name` == `gene_id` in all 1,139 GTFs                                                                                                                                                |
| 2   | UCSC makes repeated transcript IDs unique, not gene IDs                                           | `genePredToGtf.c` adds suffixes to transcript names only (`rrf_2`); no transcript ID repeats in any file                                                                                                                                               |
| 3   | The two _R. helvetica_ `lpdA` genes share one `gene_id`                                           | UCSC GTF, NCBI GFF3 and NCBI GTF rows                                                                                                                                                                                                                  |
| 4   | The UCSC browser shows them as separate items                                                     | UCSC API `getData/track` returns separate items, each with `name2` `lpdA`                                                                                                                                                                              |
| 5   | The BRC RNA-seq workflows count by `gene_id`                                                      | v1.4 workflow files: STAR `quantMode: GeneCounts`; featureCounts `gff_feature_attribute: gene_id` on `exon` rows, multi-feature counting off                                                                                                           |
| 6   | Reads from merged genes are added together; reads that map to more than one place are not counted | STAR manual (a read is counted if it overlaps one and only one gene; default gene tag `gene_id`); Subread User's Guide (meta-features by identifier; `Length` is combined exon length; `Chr`/`Start`/`End` list each feature). Not tested on real data |
| 7   | Frequencies above                                                                                 | Measured on 1,059 + 80 GTFs                                                                                                                                                                                                                            |
| 8   | Not caused by UCSC lag                                                                            | Same rate in up-to-date and lagging bacteria                                                                                                                                                                                                           |
| 9   | UCSC introduces the merging                                                                       | All 9,456 merges have distinct `gene_id`s in NCBI's GTF. No NCBI GTF repeats a `gene_id` except for genes in several parts                                                                                                                             |
| 10  | NCBI's bacterial pipeline takes symbols from protein family matches                               | NCBI: family models are used "to assign names, gene symbols, publications and EC numbers" ([source](https://www.ncbi.nlm.nih.gov/refseq/annotation_prok/))                                                                                             |
| 11  | A locus tag must be unique; a symbol need not be                                                  | INSDC feature table: `/locus_tag` "must be unique within that entry/record"; `/gene` has no such rule                                                                                                                                                  |
| 12  | Viral merges are repeat copies                                                                    | Copy strands (opposite strands in herpes simplex and mpox); roseolovirus `DR` genes lie in direct repeats                                                                                                                                              |

## Not known

- How much merging changes counts or differential-expression results on real data.
- Whether UCSC considers this a bug. Others have reported it ([Biostars](https://biostars.org/p/9572234)).
