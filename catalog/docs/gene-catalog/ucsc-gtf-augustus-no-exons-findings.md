# Most UCSC augustus GTFs have no exon rows, and the IWC RNA-seq workflows fail on them

Checked 2026-10-22. The scripts named below are local prototypes, not in this repo.

## Summary

For 3,081 eukaryote assemblies, the catalog's gene model (`geneModelUrl`) is UCSC's GenArk `augustus` GTF, UCSC's own gene prediction. In 2,459 of them (80%), that GTF has no `exon` rows at all: only `CDS`, `start_codon` and `stop_codon`.

BRC offers workflows from IWC, Galaxy's curated workflow collection. The IWC RNA-seq workflows it offers (`rnaseq-pe` and `rnaseq-sr`) align reads with STAR, which reads exons from the GTF, so they fail on these files; the failure would be the same for anyone running these IWC workflows with these GTFs. BRC chooses which GTFs it lists and passes; IWC chooses the tools. On usegalaxy.org, `rnaseq-pe` with the augustus GTF of _Fusarium graminearum_ PH-1 (`GCA_020991245.1`) stopped at STAR:

```
Fatal INPUT FILE error, no exon lines in the GTF file
Solution: check the formatting of the GTF file, it must contain some lines with exon in the 3rd column.
```

All 2,459 have a Galaxy datacache entry, so the site offers the RNA-seq workflows for every one of them. They include 999 _Fusarium_ and 541 _Aspergillus_ assemblies; 632 carry a priority-pathogen name and 225 are reference assemblies.

## Example

_Aspergillus flavus_ `GCA_030770205.1`, the first gene of its augustus GTF:

```
JARXLD010000001.1  AUGUSTUS  stop_codon   1729  1731  .     -  0  transcript_id "g1.t1"; gene_id "g1";
JARXLD010000001.1  AUGUSTUS  CDS          1729  2112  0.97  -  0  transcript_id "g1.t1"; gene_id "g1";
JARXLD010000001.1  AUGUSTUS  start_codon  2110  2112  .     -  0  transcript_id "g1.t1"; gene_id "g1";
```

The whole file: 11,211 `CDS`, 8,054 `start_codon` and 8,053 `stop_codon` rows; no `exon`, `transcript` or `gene` rows.

**Check any GTF in one line.** It prints how many rows each feature type has; an `exon` line should be there:

```sh
curl -sL https://hgdownload.soe.ucsc.edu/hubs/GCA/030/770/205/GCA_030770205.1/genes/GCA_030770205.1_ASM3077020v1.augustus.gtf.gz | gzip -dc | cut -f3 | sort | uniq -c
```

## Which tools fail

| Tool (workflow)                                             | With no `exon` rows                                                                                      | Tested                                                                                                |
| ----------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| STAR (RNA-seq)                                              | fails: "no exon lines in the GTF file", exit 104                                                         | usegalaxy.org, invocation `cda8c0e2ef7cdcab`; locally, STAR 2.7.11b                                   |
| featureCounts (RNA-seq)                                     | fails: "no features were loaded in format GTF", exit 255                                                 | locally, featureCounts 2.1.1, `-t exon`                                                               |
| STARsolo (single-cell 10x)                                  | expected to fail the same way (same GTF reading as STAR)                                                 | no                                                                                                    |
| SnpEff build (haploid, ploidy-aware, viral variant calling) | works: builds exons from the CDS rows; all 4,152 splice-site test variants called `splice_donor_variant` | locally, SnpEff 5.4c, on _P. vivax_ P01 with a GTF of only `CDS`, `start_codon` and `stop_codon` rows |
| gffread (CAPHEINE, lncRNA)                                  | reads CDS rows                                                                                           | no                                                                                                    |

The local tests used _P. vivax_ P01's genome. STAR and featureCounts were given P01's GTF with its `exon` rows removed; SnpEff was given only its `CDS`, `start_codon` and `stop_codon` rows, like an augustus file.

## How often

All 3,081 augustus GTFs the catalog uses were read:

| augustus GTFs    | Assemblies | Rows they have                     |
| ---------------- | ---------- | ---------------------------------- |
| No `exon` rows   | 2,459      | `CDS`, `start_codon`, `stop_codon` |
| With `exon` rows | 622        | also `exon`, `tss`, `tts`          |

| Genus, no `exon` rows | Assemblies |
| --------------------- | ---------- |
| Fusarium              | 999        |
| Aspergillus           | 541        |
| Cryphonectria         | 108        |
| Venturia              | 95         |
| Candida               | 89         |
| Cryptococcus          | 52         |
| Trichophyton          | 52         |
| Others                | 523        |

The 622 with `exon` rows include _Plasmodium_ (54), _Anopheles_ (48), _Plasmodiophora_ (48), _Caenorhabditis_ (47) and _Leishmania_ (33).

File dates don't separate the two kinds: in samples from both sites, files without `exon` rows were last modified between 2021 and 2025, and so were files with them. Why some have exon rows and others don't is not known.

### Every GTF a BRC user can pick

The launch page offers every GTF in the assembly's UCSC hub, not only the catalog's default. All 11,829 GTFs in the hubs of BRC's 5,506 assemblies (from UCSC's `genArkFileList.txt.gz`) were checked:

| GTF kind       | Files | With no `exon` rows | Notes                                                                                                                                                          |
| -------------- | ----- | ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `augustus`     | 4,475 | 3,435               | 2,459 are the catalog default; 976 sit beside an `ncbiGene` (766) or `ncbiRefSeq` (210) default                                                                |
| `xenoRefGene`  | 4,480 | 0                   | 1 is a catalog default                                                                                                                                         |
| `ncbiGene`     | 2,031 | 0                   | at least one gene split in 534 ([ucsc-gtf-split-transcripts-findings.md](ucsc-gtf-split-transcripts-findings.md))                                              |
| `veupathGenes` | 438   | 0                   | 37 have no multi-exon transcripts: trypanosomes, _Leishmania_, _Giardia_, microsporidia and one _Candidozyma auris_, organisms whose genes rarely have introns |
| `ncbiRefSeq`   | 390   | 0                   |                                                                                                                                                                |
| `ensGene`      | 15    | 0                   |                                                                                                                                                                |

So 3,435 of BRC's 5,506 assemblies offer at least one augustus GTF that the IWC RNA-seq workflows can't use. All 3,435 also offer `xenoRefGene` (genes mapped from other species), which has exon rows.

## GA2

GA2, the vertebrate (VGP) site built from the same code, has no `geneModelUrl` for any of its 1,226 assemblies, but its launch page lists UCSC's GTFs the same way, and it offers the RNA-seq and single-cell workflows for the 679 assemblies with a Galaxy datacache entry. In a random sample of 15 GA2 assemblies:

| GTF UCSC offers | Assemblies offering it | With no `exon` rows | Multi-exon transcripts                     |
| --------------- | ---------------------- | ------------------- | ------------------------------------------ |
| `augustus`      | 15                     | 9                   | 0 in those 9; 19,248–21,788 in the other 6 |
| `xenoRefGene`   | 15                     | 0                   | 7,910–19,480                               |
| `ncbiRefSeq`    | 3 (the `GCF_` ones)    | 0                   | 44,609–77,538                              |

So a GA2 user who picks the augustus GTF gets one STAR can't read in about three of five assemblies; `xenoRefGene` (genes mapped from other species) and `ncbiRefSeq` are usable.

## Which GTF a launch uses

The launch page lists every GTF UCSC has for the assembly (`/genes/*.gtf.gz`) and the user picks one; none is pre-selected (`getPreferredGeneModel` exists in `GTFStep/utils.ts` but isn't used). The assistant uses the catalog's `geneModelUrl`. The section above lists every GTF a BRC user can pick.

## Method

1. **Scan:** every augustus GTF the catalog uses was downloaded and its rows counted by feature type.
2. **Workflow test:** `rnaseq-pe` (IWC `main`) on usegalaxy.org with reads SRR26937815 (_F. graminearum_ PH-1, PRJNA1044545), reference genome `GCA_020991245.1`, and that assembly's augustus GTF.
3. **Tool tests:** STAR 2.7.11b, featureCounts 2.1.1 and SnpEff 5.4c from bioconda, on _P. vivax_ P01 (`GCA_900093555.2`) with GTFs stripped as described above.
4. **Every pickable GTF:** each GTF in the BRC assemblies' hubs, listed in UCSC's `genArkFileList.txt.gz`, was downloaded and its rows counted (`scan_shape.py`).
5. **GA2 sample:** 15 GA2 assemblies chosen at random (seed 7); all their hub GTFs counted the same way.

## Claims and evidence

| #   | Claim                                                    | Evidence                                                                                                                 |
| --- | -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| 1   | 2,459 of 3,081 catalog augustus GTFs have no `exon` rows | Scan of all 3,081                                                                                                        |
| 2   | The IWC RNA-seq workflow fails on them                   | usegalaxy.org job for `rna_star/2.7.11b+galaxy1`, exit 104, "Fatal INPUT FILE error, no exon lines in the GTF file"      |
| 3   | featureCounts fails too                                  | Local run, exit 255, "no features were loaded in format GTF"                                                             |
| 4   | SnpEff doesn't                                           | Local `snpEff build -gtf22` on CDS/start/stop rows only; 4,152 splice-site test variants all `splice_donor_variant`      |
| 5   | The site offers RNA-seq for all 2,459                    | RNA-seq workflows need only a Galaxy datacache entry (`build-workflow-mappings.ts`); all 2,459 have `galaxyDatacacheUrl` |

## Not known

- How many launches have used these files. The site's `workflow_runs` table records each launch's GTF from when it was deployed: added in code on 2026-04-21; an earlier check put it in production from 2026-06-16.
- Why some augustus GTFs have exon rows and others don't, and whether UCSC knows.
- How many of GA2's 679 RNA-seq-ready assemblies have an augustus GTF without exon rows (sample: 9 of 15).
- Whether STARsolo fails the same way.
