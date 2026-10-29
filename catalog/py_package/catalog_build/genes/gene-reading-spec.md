# Gene reading spec

How the gene build reads a publisher's annotation file into genes, transcripts and proteins, which cases it reads, and which it rejects until we decide how to read them. The code is `ncbi_gff3.py` (the reader) and `check_against_ncbi_gtf.py` (the check), beside this file; the tests are `catalog/py_package/tests/test_genes_*.py`.

This spec sits below the gene catalog contract (#1892), which sets what the catalog promises. Two of its principles drive everything here:

- **Accuracy over completeness.** If the build meets a case these rules don't cover, or finds that our reading of a file disagrees with the publisher's own GTF, it rejects the whole assembly and names the problem. It never guesses, patches or drops the odd rows. A wrong gene page looks right and gets cited; a missing assembly is visible and can be fixed.
- **Files are read as written.** Values come from the file under the file's own names. The build doesn't invent IDs, renumber, or fill in rows the file doesn't have.

Today the reader covers NCBI's GFF3 (RefSeq and GenBank), and the cases P. falciparum 3D7 (`GCF_000002765.6`) needs. Other cases are added one at a time, each with a fixture and a test.

## 1. Definitions and relationships

| Term               | What it is                                                                                                                                       | Example (AMA1)                                |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------- |
| Gene               | One `gene` or `pseudogene` feature of an annotation: one GFF3 row ID, which may be written as several rows                                       | AMA1                                          |
| GFF3 row ID        | The `ID` attribute. Unique in one file, and only meaningful in that file                                                                         | `gene-PF3D7_1133400`                          |
| Locus tag          | The `locus_tag` attribute: the submitter's ID for the gene. Usually unique in a genome, but not always; RefSeq's host and vector files have none | `PF3D7_1133400`                               |
| Name               | The `Name` attribute. In NCBI's files, the gene's symbol if it has one, else its locus tag. Not unique                                           | `AMA1`                                        |
| Symbol             | The `gene` attribute: the gene's short name, if it has one                                                                                       | `AMA1`                                        |
| NCBI Gene ID       | The number from `Dbxref=GeneID:…`: the gene's record in NCBI's Gene database. RefSeq files only. Never written as bare "Gene ID"                 | `810891`                                      |
| Old locus tag      | An `old_locus_tag` value: an ID the gene had before                                                                                              | (3D7's `PF3D7_0105400` has `PF3D7_0105400.1`) |
| Transcript         | A row straight under a gene whose type is a transcript type (section 2)                                                                          | the `mRNA` row                                |
| Transcript ID      | The transcript's `transcript_id`: its accession in NCBI's nucleotide database. NCBI gives none to tRNAs or to pseudogene transcripts             | `XM_001347979.2`                              |
| Protein            | The `protein_id` of the CDS rows under a transcript                                                                                              | `XP_001348015.1`                              |
| Transcript product | The `product` of a transcript row: what the transcript is, often with ", transcript variant X1". For RNA genes, the RNA's name                   | `apical membrane antigen 1`                   |
| Protein product    | The `product` of a transcript's CDS rows: the protein's name. It can differ from the transcript product (656 of 3D7's transcripts)               | `apical membrane antigen 1`                   |
| `gene_uid`         | BRC's identity for a gene; its page address. Never changes (the contract's R4)                                                                   | `d9049485-…`                                  |

Relationships:

- An assembly has annotation set versions; each holds genes.
- A gene has one or more transcripts. A transcript has zero or one protein. A gene has no product or protein of its own in the file; its transcripts' are shown.
- A gene's label, shown as "Gene ID" on its page, is its locus tag, else its name. It's for display only: two genes can share a label, so `gene_uid` identifies a gene.
- IDs that find a gene are its aliases (the snapshot's `alt_id` table), each with its type: `locus_tag`, `name`, `symbol`, `ncbi_gene_id`, `transcript_id`, `protein_accession` and `old_locus_tag`. Old locus tags are former IDs; the rest are current.

## 2. How an NCBI GFF3 is read

1. **Header.** `#!genome-build-accession` gives the assembly accession, which must be the one being built. `#!annotation-source` gives the provider and release label (`Community Annotation`, `RS_2026_09`). `#!annotation-date` gives the release date.
2. **Rows.** Comment lines and lines without 9 tab-separated columns are skipped. Attributes are split on `;` and `,` before percent-decoding, so an encoded comma (`%2C`) stays inside its value. NCBI encodes the commas between old locus tags, so those are split again after decoding.
3. **Genes** are `gene` and `pseudogene` rows. Rows that share an `ID` are one gene written in pieces (NCBI marks it `is_ordered`); its location runs from the first piece to the last.
4. **Transcripts** are rows whose `Parent` is a gene and whose type is one of `mRNA`, `transcript`, `ncRNA`, `tRNA`, `rRNA`, `snRNA` or `snoRNA`: the types 3D7's genes have.
5. **Proteins** come from CDS rows whose `Parent` is a transcript: the first `protein_id` and the first `product` (the protein product) among them.
6. **Rows under transcripts** other than CDS (exons, for example) aren't read.
7. **Products.** A transcript's transcript product and protein product are each read as written, from its own row and from its CDS rows; neither stands in for the other.
8. **The temporary `gene_uid`** is a UUID5 of the assembly accession and the gene's row ID. See the appendix.

## 3. Cases we read

Each case has a fixture in `catalog/py_package/tests/data/ncbi_cases/`: one or more genes' rows copied verbatim from NCBI's GFF3 (`.gff3`), with the same genes' rows from NCBI's GTF (`.gtf`).

| Case                                   | In the file                                                                                                                  | How it's read                                                      | Example                                                                                      | Fixture                              |
| -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ | -------------------------------------------------------------------------------------------- | ------------------------------------ |
| Protein-coding gene                    | `gene` → `mRNA` (with `transcript_id`) → `CDS` (with `protein_id`)                                                           | One gene, one transcript, one protein                              | 3D7 AMA1                                                                                     | `pfalciparum_3d7`                    |
| Several transcripts                    | Two `mRNA` rows under one gene, each with its own CDS                                                                        | One transcript each, each with its own protein                     | 3D7 `PF3D7_0105400`                                                                          | `pfalciparum_3d7`                    |
| Three transcripts with one product     | Three `mRNA` rows under one gene, each with its own CDS, all named `uncharacterized protein`                                 | One transcript each, told apart by their IDs and proteins          | 3D7 `PF3D7_0613000`                                                                          | `pfalciparum_3d7_three_transcripts`  |
| Transcripts with different products    | Two `mRNA` rows whose products differ (`RNA recognition motif domain-containing protein`, `putative RNA-binding protein`)    | Each transcript keeps its own products                             | 3D7 `PF3D7_0205700`                                                                          | `pfalciparum_3d7_transcripts_differ` |
| Transcript and protein products differ | The `mRNA` row's `product` (`ATP-dependent DNA/RNA helicase PSH1`) and its CDS rows' (`putative ATP-dependent RNA helicase`) | Both kept, as the transcript product and the protein product       | 3D7 PSH1 (`PF3D7_0103600`)                                                                   | `pfalciparum_3d7_products_differ`    |
| Old locus tags                         | `old_locus_tag=PF3D7_0105400.1%2CPF3D7_0105400.2`                                                                            | Two former IDs                                                     | 3D7 `PF3D7_0105400`                                                                          | `pfalciparum_3d7`                    |
| RNA without a transcript ID            | `gene` → `tRNA` with no `transcript_id`                                                                                      | A transcript with no ID; nothing finds the gene by a transcript ID | 3D7 `PF3D7_0203500`                                                                          | `pfalciparum_3d7`                    |
| Transcribed pseudogene                 | `pseudogene` → `transcript` (`pseudo=true`, no `transcript_id`), `product` on the transcript row                             | A transcript with no ID, a transcript product and no protein       | 3D7 `PF3D7_0100500`                                                                          | `pfalciparum_3d7`                    |
| Genes sharing a name, no locus tags    | Two `gene` rows, `ID=gene-Trnaa-ggc` and `ID=gene-Trnaa-ggc-2`, both `Name=Trnaa-ggc`                                        | Two genes, both labelled `Trnaa-ggc`                               | _Aedes aegypti_ `GCF_002204515.2` (the whole file is rejected for other rows; see section 4) | `aedes_genes_sharing_a_name`         |

## 4. Cases we reject, until decided

The build fails with the reason shown, and nothing is written. Counts come from 262 sampled catalog assemblies on 2026-10-28, read by an earlier version of the reader.

| Case                                              | In the file                                                               | Reason given                                                     | Seen in                                                                                    | Fixture                                                                                            |
| ------------------------------------------------- | ------------------------------------------------------------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------- |
| CDS rows straight under a gene                    | No transcript row; `CDS` with `Parent=gene-…`                             | `… has a CDS row straight under it`                              | GenBank submissions: P. vivax P01, P. ovale `GCA_900088545.1`, Vitrella `GCA_001179505.1`  | `povale_gene_in_several_rows`, `vitrella_cds_beside_an_mrna`, `vitrella_genes_sharing_a_locus_tag` |
| Other rows straight under a gene                  | `lnc_RNA`, `exon`, `five_prime_UTR`, `three_prime_UTR`, … under a gene    | `… has a <type> row straight under it`                           | _Aedes_ (`lnc_RNA`, `exon`); 4 GenBank eukaryotes with UTR rows (e.g. `GCA_900617775.1`)   | none yet                                                                                           |
| A gene in pieces on two strands or sequences      | Rows with one `ID` on both strands (`exception=trans-splicing`)           | `… has rows on more than one sequence or strand`                 | _Giardia_ `GCF_000002435.2`                                                                | `giardia_gene_on_two_strands`                                                                      |
| A gene with no transcript rows                    | A `gene` row with nothing under it                                        | `… has no transcript rows`                                       | not measured                                                                               | none yet                                                                                           |
| A row without 9 columns                           | A non-comment line that isn't 9 tab-separated columns                     | `A row without 9 columns …`                                      | none in 3D7                                                                                | none                                                                                               |
| A GFF3 with no genes                              | No `gene` or `pseudogene` rows                                            | `The GFF3 has no genes`                                          | none in 3D7                                                                                | none                                                                                               |
| A GFF3 that doesn't name its assembly             | No `#!genome-build-accession` header line                                 | `The GFF3 doesn't name its assembly …`                           | none: every NCBI file checked has it                                                       | none                                                                                               |
| A row before its parent row                       | `Parent=` names a row that comes later in the file                        | `A <type> row comes before its parent …`                         | none in 3D7                                                                                | none                                                                                               |
| A transcript written as several rows              | Two transcript rows with one `ID`                                         | `… is written as several rows`                                   | none in the 214 of them that downloaded for this count                                     | none                                                                                               |
| A gene with no `locus_tag` or `Name`              |                                                                           | `… has no locus_tag or Name`                                     | none in 262 files                                                                          | none                                                                                               |
| A gene or transcript row with no `ID`             |                                                                           | `… has no ID`                                                    | not measured                                                                               | none                                                                                               |
| A gene crossing the origin of a circular sequence | One row whose end is past the sequence's end; NCBI's GTF splits it in two | The check: the gene is only in the GFF3, and one only in the GTF | 5 bacteria (`…_RS00005`)                                                                   | none yet                                                                                           |
| A GTF the check can't read                        | A gene's rows before its `gene` row                                       | `GTF row for … comes before its gene row`                        | 5 assemblies (e.g. `GCF_000002985.6`)                                                      | none yet                                                                                           |
| Other disagreements with NCBI's GTF               | Not yet looked at                                                         | The check's differences                                          | 7 viruses; 4 RefSeq animals' microRNA products; _Brugia malayi_ `GCF_000002995.4` proteins | none yet                                                                                           |

## 5. The check against NCBI's GTF

NCBI publishes each annotation as GFF3 and GTF, converting with its own code, so where both files describe a gene they should agree. Every build downloads the GTF beside the GFF3 (`_genomic.gff.gz` → `_genomic.gtf.gz`) and compares them gene by gene. Any difference rejects the assembly.

- **Pairing:** genes are paired by location (sequence, start, end, strand); genes at the same location pair in file order.
- **Compared for each gene:** locus tag, symbol, NCBI Gene ID, biotype, old locus tags and number of transcripts.
- **Compared for each transcript:** location, protein accession, transcript product and protein product. Each transcript is matched to the GTF transcript of the ID the GFF3 implies for it:
  - its `transcript_id` (`XM_001347979.2`);
  - else the last part of its `orig_transcript_id`, which NCBI's GTF uses as the ID (`gnl|ASM:GCA_000002765|mrna.PF3D7_0100500-RA` → `mrna.PF3D7_0100500-RA`; 3D7's 158 pseudogene transcripts);
  - else none: the GTF numbers it `unassigned_transcript_N` (3D7's 45 tRNAs), so these are matched as a group against the GTF's `unassigned_transcript_N` transcripts.

  A GTF transcript left over is a difference, so a transcript ID the reader drops can't pass.

- **Not compared, because the GTF makes them up or changes them:** its `gene_id` (it adds `_1`, `_2` to repeated names), the numbers in `unassigned_transcript_N`, and CDS coordinates (its CDS rows leave out the stop codon).

The check also runs by hand: `python -m catalog_build.genes.check_against_ncbi_gtf <GFF3 URL or path>`.

## 6. Open

- **Pseudogene transcripts' `orig_transcript_id`** (`gnl|ASM:GCA_000002765|mrna.PF3D7_0100500-RA`) is read for the GTF check but isn't stored, so it doesn't find the gene.
- **Skipping unchanged assemblies.** NCBI's `md5checksums.txt` in each assembly folder gives each file's md5 without downloading it. An assembly needs rebuilding and rechecking when its GFF3's md5 changes or when the reader or check changes.

## Appendix: design decisions

**Read the GFF3, not NCBI's GTF.** The GTF is NCBI's conversion of the same annotation for analysis tools, and it changes things to fit the format: it makes repeated gene IDs unique (`Trnaa-ggc_1`), numbers transcripts that have no ID (`unassigned_transcript_1`), and drops `Name`. The GFF3 is the original. The GTF is still useful: as a conversion made by NCBI's code rather than ours, it's the check (section 5). Workflow runs use UCSC's GTFs, not NCBI's, so reading NCBI's GTF wouldn't line gene pages up with results either.

**Not NCBI's Datasets gene report.** NCBI's Datasets API serves each assembly's genes as JSON (`/genome/accession/<accession>/annotation_report`), so nothing would need parsing. But on 2026-10-28 it didn't match 3D7's current annotation: AMA1's transcript was `XM_001347979.1` there and `.2` in the file, its location was the coding region only, and it listed 5,615 genes to the file's 5,611. It carries no release label or file checksum, so an answer can't be tied to the exact annotation it came from (the contract's R1 and R2). It does show NCBI's model for GenBank files: P. ovale's `POVWA2_000020` has its protein listed on the gene, with no transcript.

**Not an existing tool.** GFF3 libraries (gffutils, BCBio-GFF) parse rows and attributes and link parents to children: the easy part, about 60 lines here. They don't decide which attributes to read, which rows are transcripts, or which row a product comes from, which is what this spec is about. Clean-up tools (AGAT, gffread) "fix" files by adding missing transcripts, inventing IDs and merging features, which is what this spec rules out.

**No made-up IDs.** An earlier version gave each gene a single "gene ID" (locus tag, else name) and would have added `_1`, `_2` to repeats, as NCBI's GTF does; it also made BRC transcripts (`PF3D7_0203500.t1`) where the file had none. Both were dropped for reading what the file says: the locus tag, name and symbol are stored as written, a transcript without a transcript ID has none, and genes are told apart by `gene_uid`. "Gene name" was rejected as a field name because biologists read it as the symbol or the full name.

**Reject the whole assembly, not the odd genes.** A partial gene list misleads too: a lookup on a real gene would say "not found". Other assemblies are unaffected.

**The temporary `gene_uid` comes from the GFF3 row ID.** Until the provenance database mints UUIDs (the contract's section 1), the snapshot computes each gene's from the assembly accession and its row ID, the one value the file guarantees unique. It stays the same on every build only while NCBI keeps the gene's row ID.
