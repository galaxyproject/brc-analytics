# Gene history from past annotation releases

Checked 2026-10-24. The scripts and results were in a local prototype directory (`catalog/prototypes/genes/output/findings-2026-10-24/`), not in this repo.

## Summary

We can rebuild a gene-by-gene history for VEuPathDB organisms: when each gene ID was last seen, and whether it was renamed, merged or retired. VEuPathDB keeps every release's GFF3 and previous-ID file back to release 24. Comparing two releases' files gives the history, with VEuPathDB's own statements as the links and position overlap as a check. A test on _P. falciparum_ 3D7, release 24 against release 71, worked.

The spec's future use case "What changed in this gene over time?" said past changes mostly can't be rebuilt; for VEuPathDB they can, and the spec was updated (see What this changes in the spec).

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

## NCBI: a declared old ID that names another current gene

Checked 2026-10-28, while building #1904 (serve 3D7's genes from a temporary checked-in DuckDB file through the gene API). In 3D7's RefSeq GFF3 (`GCF_000002765.6`, `RS_2026_09`), 100 genes have an `old_locus_tag`. 98 are `.1`/`.2` versions of the gene's own tag. The other 2 are not:

| Gene                                   | Its `old_locus_tag` | What that old tag is today                                              |
| -------------------------------------- | ------------------- | ----------------------------------------------------------------------- |
| `PF3D7_1440200` (SPP, GeneID `811964`) | `PF3D7_1440300`     | The current locus tag of a different gene, PBGS                         |
| `PF3D7_0809250` (GeneID `54778396`)    | `PF3D7_0809300`     | No current gene: an ncRNA NCBI withdrew (GeneID `36312509`, 2020-05-11) |

**SPP and PBGS were never one gene.** Both have their own pre-2012 IDs in PlasmoDB: SPP is `PF14_0382` and PBGS `PF14_0381`. Both PlasmoDB and NCBI draw SPP's model from PBGS's first base, on the same strand (1,638,717–1,647,251 and 1,638,717–1,641,760 on chromosome 14); PlasmoDB already gave them a shared start at release 24 (1,639,477). What NCBI did, from `gene_history` and NCBI Gene:

| When       | NCBI                                                                                                                             |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Original   | PBGS is GeneID `811963`, SPP is GeneID `811964`                                                                                  |
| 2018-04-06 | `gene_history`: `811963` (PBGS) withdrawn, with no replacement                                                                   |
| Then       | GeneID `811964` is the only gene there and carries `PF3D7_1440300` (inferred: `811964` still lists it as an alias)               |
| Later      | PBGS is back as a new GeneID, `314888234`, with locus tag `PF3D7_1440300`; `811964` keeps `PF3D7_1440300` as its `old_locus_tag` |

When `314888234` was created wasn't checked.

What this shows:

- **A declared link can be wrong.** Read as a link, SPP's `old_locus_tag` says SPP was once PBGS. PlasmoDB says they have always been separate genes. NCBI's `old_locus_tag` here looks like a leftover of its own temporary merge.
- **An NCBI GeneID can change while the gene stays the same.** PBGS went from `811963` to `314888234`. `gene_history` lists `811963` as withdrawn with no replacement, so nothing NCBI publishes links the two GeneIDs; only the locus tag and position do. Someone with `811963` from before 2018 can't find PBGS by it.
- **One file shows the shape, not the event.** From one GFF3, an `old_locus_tag` that is another current gene's tag can be found (1 in 3D7), as can one shared by two genes (a split's shape: 0 in 3D7). What happened needs a second release, `gene_history` or VEuPathDB's previous IDs.

For gene search, the shared value finds both genes: PBGS on its current locus tag first, SPP on the old one, labelled as a former ID (#1905, prefix gene search over the temporary 3D7 DuckDB file).

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

Made 2026-10-28, from the NCBI section above:

- **Gene identifiers**, NCBI GeneID: usually stable, but a gene can lose its GeneID and come back under a new one, with nothing linking the two.
- **Links between names**: a declared `old_locus_tag` that is another current gene's locus tag isn't used as a link until decided (contract, Open decisions).

## Files

In the local prototype directory `catalog/prototypes/genes/output/findings-2026-10-24/` (not in this repo):

- `scripts/fetch_3d7.sh`: downloads the 3D7 alias files (releases 24, 50, 70, 71), extracts gene tables from the release 24 and 71 GFF3s, and filters NCBI's `gene_history` to Plasmodium. Needs `VIEWPATH_API_KEY` in `catalog/.env`.
- `scripts/gene_history.py`: classifies gone IDs between two releases.
- `results/`: the inputs above and `gene_history_3d7_r24_r71.txt`, the script's output.

The NCBI section's GeneIDs were read from NCBI Gene's E-utilities (`esummary`), and the PlasmoDB names and locations from PlasmoDB's web service, both on 2026-10-28.
