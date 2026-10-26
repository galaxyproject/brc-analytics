# Gene history from past annotation releases

Checked 2026-10-24. The scripts and results were in a local prototype directory (`catalog/prototypes/genes/output/findings-2026-10-24/`), not in this repo.

## Summary

We can rebuild a gene-by-gene history for VEuPathDB organisms: when each gene ID was last seen, and whether it was renamed, merged or retired. VEuPathDB keeps every release's GFF3 and previous-ID file back to release 24. Comparing two releases' files gives the history, with VEuPathDB's own statements as the links and position overlap as a check. A test on _P. falciparum_ 3D7, release 24 against release 71, worked.

This contradicts the spec's future use case "What changed in this gene over time?", which says "past changes mostly can't be rebuilt". For VEuPathDB they can.

Whether anyone needs it is unproven; see Use cases.

## Sources of past annotation

| Publisher     | What's kept                                                                                                                                                                     | Assembly known?                              |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| **VEuPathDB** | A GFF3 per organism and release, releases 24–71: 29,241 GFF3 files across 830 organisms. 3D7, _T. gondii_ ME49 and _L. major_ Friedlin have all 48 releases; P01 has 43 (29–71) | Yes: the organism records give the accession |
| **NCBI**      | One directory per assembly version. 3D7 has six RefSeq versions (`GCF_000002765.1`–`.6`); `.4` and `.6` have a GFF3 and a GTF, `.1` has neither                                 | Yes: the directory is the version            |
| **Ensembl**   | Every release on its FTP site (not checked)                                                                                                                                     | Yes                                          |

**Ensembl re-hosts rather than annotates our pathogens.** Its API's `genebuild` field (2026-10-24) shows where each genome's gene models came from:

- Protists: 200 of 236 from ENA (the submitter's annotation, the same as GenBank's), 19 from VEuPathDB.
- Fungi: 1,499 genomes, from Broad, JGI and other submitters.
- Metazoa: 386 genomes, mixed; 13 from VEuPathDB.

Its snapshots can be old: 3D7's genes are a VEuPathDB snapshot from 2020-09-01. So Ensembl adds older copies of annotation we can get elsewhere, not new gene models.

## Change records each publisher publishes

- **Ensembl** has per-release stable-ID history (retired, merged, renamed), the kind HCA used. It doesn't cover our pathogens in practice: its API returned an internal error for `PF3D7_0209400` and "No object found" for `PFB0425c`.
- **NCBI** publishes `gene_history.gz`, a list of discontinued GeneIDs with a date and the replacement, if any. It is about 163 MB gzipped, updated daily. 3D7 (taxon 36329) has 891 entries: 889 withdrawn, 2 replaced, dated 2003–2026. It's dated, not tied to releases, and doesn't record renames. The RefSeq GFF3's `old_locus_tag` is sparse: 100 of 3D7's 5,453 genes, and not `PF3D7_0209400`.
- **VEuPathDB** publishes no change list. Each release's `GeneAliases.txt` lists each current gene, then all its previous IDs, building up over time, e.g. `PF3D7_0209400` → `PF02_0090`, `PFB0423c`, `PFB0425c`. VEuPathDB lists the file for 227 of its 830 organisms. For the rest, a history can only say "gone" or "overlaps", with no stated successor.

## Test: 3D7, release 24 against release 71

Gene IDs and positions from each release's GFF3, successors from release 71's `GeneAliases.txt`:

| Genes              | Count |
| ------------------ | ----- |
| Release 24         | 5,777 |
| Release 71         | 5,720 |
| Kept the same ID   | 5,492 |
| Gone by release 71 | 285   |
| New by release 71  | 228   |

The 285 gone IDs:

| Outcome                                            | Count | Example                                                                                        |
| -------------------------------------------------- | ----- | ---------------------------------------------------------------------------------------------- |
| VEuPathDB names a successor, and it overlaps       | 176   | `PF3D7_0105400.1` → `PF3D7_0105400`                                                            |
| VEuPathDB names a successor on a renamed sequence  | 57    | `PFC10_API0001:tRNA` → `PF3D7_API05800`, on the apicoplast (`PFC10_API_IRAB` → `Pf3D7_API_v3`) |
| No successor named, but overlaps a release 71 gene | 3     | `PF3D7_0112600` overlaps `PF3D7_0112500`                                                       |
| No successor named, no overlap: retired            | 49    | `PF3D7_0112400`                                                                                |

- **Merges:** 86 release 71 genes list two or more gone IDs. Some are release 24's `.1`/`.2` IDs folded into one gene, so not all are real merges.
- **The 57 on renamed sequences** are a gap in the script, not disagreements. The mitochondrion and apicoplast were renamed (`M76611` → `Pf3D7_MIT_v3`), so overlap can't be compared without a sequence-name map.
- **Not yet counted:** splits (one old ID listed under several new genes).
- **A kept ID doesn't mean an unchanged gene:** 4,443 of the 5,492 changed start or end, e.g. `PF3D7_0101300` went from 74,563–75,366 to 74,295–75,622, probably from added UTRs (unchecked).

So VEuPathDB's statements and position overlap agree wherever both can be checked. Overlap adds 3 candidate links that VEuPathDB doesn't state.

## Caching the history files

From VEuPathDB's file list (sizes uncompressed unless stated):

| Files                                                                             | Files   | Size                                                                             |
| --------------------------------------------------------------------------------- | ------- | -------------------------------------------------------------------------------- |
| `GeneAliases.txt`, releases 24–71                                                 | 4,973   | 1.8 GB                                                                           |
| GFF3, releases 24–64 ("Annotated Transcripts", with the genome sequence included) | 13,451  | 209 GB; about 60 GB gzipped, estimated from 3D7 release 24 (48.2 MB → 14.0 MB)   |
| GFF3, releases 65–71 ("Full GFF")                                                 | 4,615   | 83 GB; about 9 GB gzipped                                                        |
| ORF GFF3s                                                                         | 11,175  | 1.3 TB; not needed                                                               |
| Gene tables extracted from the GFF3s (ID, position, type)                         | ~18,000 | about 0.3 MB each (3D7: 276 KB at release 24, 355 KB at release 71), so a few GB |

Keeping every GFF3 gzipped costs about $1.60 a month in S3 Standard ($0.023 per GB-month, us-east-1). Keeping only the alias files and the extracted gene tables costs pennies, and the GFF3s can be fetched again if a gene model is ever needed. Either way the history comes from small files.

Not sized: NCBI's older GFF3s per assembly version.

## Use cases

The questions a history answers, with who asks them and an estimate of how useful the answer is.

| Question                                                                                            | Example                                                                                   | Who asks                                                                                | Utility                                                                                                                   |
| --------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| **What is this old ID called now?**                                                                 | `PFB0425c` → `PF3D7_0209400`                                                              | Anyone reading a paper from before the 2012 renaming                                    | High need, but VEuPathDB's search already answers it. Ours matters on gene pages (old IDs redirect) and for the assistant |
| **What happened to it?**                                                                            | Renamed, merged into X, split into X and Y, retired                                       | Same                                                                                    | Medium: VEuPathDB gives the successor, not the event                                                                      |
| **When was it last seen?**                                                                          | "Last seen in release 43, assembly `GCA_…`"                                               | Same, and curators                                                                      | Medium: turns a dead end into an explanation                                                                              |
| **Translate my results to the current release**                                                     | A count table from an old GTF: which rows map cleanly, which are ambiguous, which dropped | Galaxy users with old results                                                           | Potentially high; nobody answers it well. Needs BRC to take processed data in, which it doesn't yet                       |
| **Should I rerun?**                                                                                 | Which genes in my analysis changed between my run's release and now                       | Galaxy users                                                                            | Medium; needs runs to record their annotation release (see the spec's Refresh policy and future use cases)                |
| **Did the gene itself change, and when?**                                                           | `PF3D7_0101300`'s span changed between 24 and 71                                          | Users comparing results across years                                                    | Low to medium                                                                                                             |
| **Which release does my file match?** (HCA's "which Ensembl release is my dataset consistent with") | A gene list or count table with no annotation version                                     | Anyone combining processed datasets across studies, e.g. Plasmodium single-cell atlases | Low now: BRC workflows start from raw reads with a GTF we chose, so the release is known. Comes free with the history     |
| **Is this NCBI gene the same as this VEuPathDB gene?**                                              | Same assembly, overlapping position                                                       | Our own build                                                                           | Medium, for linking records across publishers                                                                             |
| **How settled is this organism's annotation?**                                                      | Genes changed per release                                                                 | Users choosing an assembly                                                              | Low                                                                                                                       |

**Our own use is the most certain:** gene pages need web addresses that survive renames, and the assistant will be asked about genes by names from papers. Most other users want only today's gene.

Demand outside our own use is unproven. Two cheap checks:

1. Ask a few target users whether old IDs or old results have caused them trouble.
2. Build the 3D7 history across all 48 releases and show "what is this called now", "what happened to it" and "translate my results" working on a real old gene list.

## What this changes in the spec

Made 2026-10-24:

- **Future use cases**, "What changed in this gene over time?": past changes can be rebuilt for VEuPathDB from release 24 on, not "mostly can't be rebuilt".
- **Old IDs** stays as is: successors still come from the publisher. Position overlap is a check, and its extra links fall under "Deferred: inferring changes the publisher didn't declare", stored with evidence `inferred`.
- **Open questions**: the storage-cost question now includes releases 24–64, so only NCBI's GFF3s are unsized.

## Files

In the local prototype directory `catalog/prototypes/genes/output/findings-2026-10-24/` (not in this repo):

- `scripts/fetch_3d7.sh`: downloads the 3D7 alias files (releases 24, 50, 70, 71), extracts gene tables from the release 24 and 71 GFF3s, and filters NCBI's `gene_history` to Plasmodium. Needs `VIEWPATH_API_KEY` in `catalog/.env`.
- `scripts/gene_history.py`: classifies gone IDs between two releases.
- `results/`: the inputs above and `gene_history_3d7_r24_r71.txt`, the script's output.
