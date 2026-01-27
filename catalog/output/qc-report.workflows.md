# Catalog Workflows QC report

## Newly added workflows this run

> **Note:** This section shows workflows added to workflows.yml in this script run. On subsequent runs, these will no longer appear here. Commit or save this report if you need to track what was added.

None

## Active workflows with version not on Dockstore

None

## Workflows not using newest IWC version (newer not on Dockstore yet)

None

## Workflows with unknown category and one valid category (kept)

- #workflow/github.com/iwc-workflows/fastq-to-matrix-10x/scrna-seq-fastq-to-matrix-10x-cellplex (categories: OTHER, TRANSCRIPTOMICS)
- #workflow/github.com/iwc-workflows/fastq-to-matrix-10x/scrna-seq-fastq-to-matrix-10x-v3 (categories: OTHER, TRANSCRIPTOMICS)
- #workflow/github.com/iwc-workflows/sars-cov-2-pe-illumina-artic-variant-calling/COVID-19-PE-ARTIC-ILLUMINA (categories: OTHER, VARIANT_CALLING)
- #workflow/github.com/iwc-workflows/sars-cov-2-pe-illumina-wgs-variant-calling/COVID-19-PE-WGS-ILLUMINA (categories: OTHER, VARIANT_CALLING)
- #workflow/github.com/iwc-workflows/sars-cov-2-se-illumina-wgs-variant-calling/COVID-19-SE-WGS-ILLUMINA (categories: OTHER, VARIANT_CALLING)

## Active workflows excluded for having only unknown category

None

## Workflows with multiple valid categories

- #workflow/github.com/iwc-workflows/generic-non-segmented-viral-variant-calling/main (categories: CONSENSUS_SEQUENCES, VARIANT_CALLING)

## Parameter changes by workflow

> **Note:** New parameters are added to workflows.yml on each run. On subsequent runs, they will no longer appear as 'new' even if stale parameters haven't been addressed yet. If you see both stale and new params for a workflow, commit or save this report before re-running so you don't lose the pairing info (useful for identifying renames).

None

## Inactive workflows in workflows.yml

> **Note:** These workflows are in workflows.yml but not marked active. Parameter counts can help assess complexity for potential activation.

### Genome assembly with Flye - ASSEMBLY (1 parameters)

- Input sequence reads

### Functional annotation of protein sequences - ANNOTATION (1 parameters)

- input

### Repeat masking with RepeatModeler and RepeatMasker - ANNOTATION (1 parameters)

- input

### BigWig Replicates Averaging Workflow - REGULATION, TRANSCRIPTOMICS (2 parameters)

- Bigwig to average
- bin_size

### Bacterial Genome Assembly using Shovill - ASSEMBLY (2 parameters)

- Input adapter trimmed sequence reads (forward)
- Input adapter trimmed sequence reads (reverse)

### Influenza A isolate subtyping and consensus sequence generation - CONSENSUS_SEQUENCES (2 parameters)

- References per segment collection
- Sequenced paired-end data

### Generic variation analysis on WGS PE data - VARIANT_CALLING (3 parameters)

- Paired Collection
- GenBank genome
- Name for genome database

### Assembly polishing with long reads - ASSEMBLY (3 parameters)

- Assembly to be polished
- long reads
- minimap setting (for long reads) 

### Single-Cell Mixture Analysis: baredSC 1D Log-Normalized Models - TRANSCRIPTOMICS (4 parameters)

- Tabular with raw expression values
- Gene name
- Maximum value in logNorm
- Maximum number of Gaussians to study

### Consensus Peak Calling for ChIP-seq Paired-End Replicates - REGULATION (4 parameters)

- n rmDup BAMPE
- Minimum number of overlap
- effective_genome_size
- bin_size

### Consensus Peak Calling for ChIP-seq Single-End Replicates - REGULATION (4 parameters)

- n rmDup BAMSR
- Minimum number of overlap
- effective_genome_size
- bin_size

### Hi-C Format Conversion: Juicer Medium to Cooler Files - REGULATION (4 parameters)

- Bin size in bp
- genome name
- Juicer Medium Tabix with validPairs
- Interactions to consider to calculate weights in normalization step

### Generic variation analysis reporting - VARIANT_CALLING (4 parameters)

- Variation data to report
- AF Filter
- DP Filter
- DP_ALT Filter

### BREW3R - TRANSCRIPTOMICS (5 parameters)

- Input gtf
- BAM collection
- strandedness
- minimum coverage
- minimum FPKM for merge

### Gene Ontology and KEGG Pathway Enrichment Analysis - TRANSCRIPTOMICS (5 parameters)

- Select genome to use
- Differential expression result
- Select gene ID format
- gene length
- KEGG pathways

### Hi-C Data Processing: FASTQ to Valid Interaction Pairs - REGULATION (5 parameters)

- PE fastq input
- genome name
- Restriction enzyme
- No fill-in
- minimum MAPQ

### COVID-19: variation analysis of ARTIC ONT data - VARIANT_CALLING (5 parameters)

- ONT-sequenced reads
- Minimum read length
- Maximum read length
- NC_045512.2 FASTA sequence of SARS-CoV-2
- Primer binding sites info in BED format

### SARS-CoV-2 Illumina Amplicon pipeline - iVar based - VARIANT_CALLING (5 parameters)

- Paired read collection for samples
- Reference FASTA
- Primer BED
- Read fraction to call variant
- Minimum quality score to call base

### Genome annotation with Maker - ANNOTATION (6 parameters)

- BUSCO lineage
- Genome sequence
- Genome assembly
- Protein sequences
- Augustus training
- SNAP training

### Metagenomic Genes Catalogue Analysis - ANNOTATION (6 parameters)

- Metagenomics Trimmed reads
- AMR genes detection database
- Virulence genes detection database
- starAMR database
- mmseqs2 taxonomy DB
- eggNOG database

### RNA-Seq Differential Expression Analysis with Visualization - TRANSCRIPTOMICS (6 parameters)

- Counts from changed condition
- Counts from reference condition
- Count files have header
- Gene Annotaton
- Adjusted p-value threshold
- log2 fold change threshold

### COVID-19: variation analysis reporting - VARIANT_CALLING (6 parameters)

- Variation data to report
- AF Filter
- DP Filter
- DP_ALT Filter
- gene products translations
- Number of Clusters

### Single-Cell Mixture Analysis: baredSC 2D Log-Normalized Models - TRANSCRIPTOMICS (7 parameters)

- Tabular with raw expression values
- Gene name for x axis
- maximum value in logNorm for x-axis
- Gene name for y axis
- maximum value in logNorm for y-axis
- Maximum number of Gaussians to study
- compute p-value

### Hi-C Processing: FASTQ to Balanced Cool Files - REGULATION (8 parameters)

- PE fastq input
- genome name
- Restriction enzyme
- No fill-in
- minimum MAPQ
- Bin size in bp
- Interactions to consider to calculate weights in normalization step
- region for matrix plotting

### Single-Cell Pseudobulk Differential Expression Analysis with edgeR - TRANSCRIPTOMICS (8 parameters)

- Source AnnData file
- Pseudo-bulk: Fields to merge
- Group by column
- Sample key column
- Name Your Raw Counts Layer
- Factor fields
- Formula
- Gene symbol column

### Capture Hi-C Processing: FASTQ to Balanced Cool Files - REGULATION (10 parameters)

- PE fastq input
- genome name
- Restriction enzyme
- No fill-in
- minimum MAPQ
- Bin size in bp
- Interactions to consider to calculate weights in normalization step
- capture region (chromosome)
- capture region (start)
- capture region (end)

## IWC workflows not in workflows.yml (excluded by category filter)

- Allele-based Pathogen Identification ( (from Dockstore: Microbiome))
- Assembly decontamination VGP9  ( (from Dockstore: Vertebrate Genome Project))
- COVID-19: consensus construction ( (from Dockstore: SARS-COV-2))
- Clinical Metaproteomics Data Interpretation ( (from Dockstore: Proteomics, Metaproteomics))
- Clinical Metaproteomics Discovery Workflow ( (from Dockstore: Proteomics, Metaproteomics))
- Clinical Metaproteomics Quantitation ( (from Dockstore: Proteomics, Metaproteomics))
- Clinical Metaproteomics Verification Workflow ( (from Dockstore: Proteomics, Metaproteomics))
- Create GRO and TOP complex files ( (from Dockstore: Computational Chemistry))
- End-to-End Tissue Microarray Analysis ( (from Dockstore: Imaging))
- Fragment-based virtual screening using rDock for docking and SuCOS for pose scoring ( (from Dockstore: Computational Chemistry))
- Gene-based Pathogen Identification ( (from Dockstore: Microbiome))
- Generate Nx and Size plots for multiple assemblies ( (from Dockstore: Vertebrate Genome Project))
- Generate a Clinical Metaproteomics Database ( (from Dockstore: Proteomics, Metaproteomics))
- Genome Assembly from Hifi reads - VGP3 ( (from Dockstore: Vertebrate Genome Project))
- Genome Assembly from Hifi reads with HiC phasing - VGP4 ( (from Dockstore: Vertebrate Genome Project))
- Genome Assembly with Pacbio Hifi reads and Trio data for phasing - VGP5 ( (from Dockstore: Vertebrate Genome Project))
- Genome annotation with Braker3 (none)
- Host or Contamination Removal on Long-Reads (none)
- Host or Contamination Removal on Short-Reads (none)
- K-mer profiling and reads statistics VGP1 ( (from Dockstore: Vertebrate Genome Project))
- MAPseq to ampvis2 ( (from Dockstore: Microbiome))
- MGnify amplicon summary tables ( (from Dockstore: Microbiome))
- MGnify's amplicon pipeline v5.0 ( (from Dockstore: Microbiome))
- MGnify's amplicon pipeline v5.0 - ITS ( (from Dockstore: Microbiome))
- MGnify's amplicon pipeline v5.0 - Quality control PE ( (from Dockstore: Microbiome))
- MGnify's amplicon pipeline v5.0 - Quality control SE ( (from Dockstore: Microbiome))
- MGnify's amplicon pipeline v5.0 - rRNA prediction ( (from Dockstore: Microbiome))
- MMGBSA calculations with GROMACS ( (from Dockstore: Computational Chemistry))
- Mass spectrometry: GCMS with metaMS ( (from Dockstore: Computational Chemistry, Metabolomics))
- Mass spectrometry: LC-MS preprocessing with XCMS ( (from Dockstore: Computational Chemistry, Metabolomics))
- MetaProSIP OpenMS 2.8 ( (from Dockstore: Proteomics))
- Metagenome-Assembled Genomes (MAGs) generation ( (from Dockstore: Microbiome))
- Metagenomics Taxonomic and Antibiotic Resistance Gene (ARG) Profiling (none)
- Mitogenome Assembly VGP0 ( (from Dockstore: Vertebrate Genome Project))
- Molecular formula assignment and recalibration with MFAssignR package. ( (from Dockstore: Metabolomics))
- Multiplex Tissue Microarray Analysis ( (from Dockstore: Imaging))
- Nanopore Preprocessing ( (from Dockstore: Microbiome))
- Parallel Accession Download ( (from Dockstore: Data Fetching))
- Pathogen Detection PathoGFAIR Samples Aggregation and Visualisation ( (from Dockstore: Microbiome))
- Post-Assembly Quality Control and Contamination Check for Bacterial Genomes ( (from Dockstore: Metagenomics, Microbiome))
- PretextMap Generation from 1 or 2 haplotypes ( (from Dockstore: Vertebrate Genome Project))
- Purge duplicate contigs from a diploid assembly VGP6 ( (from Dockstore: Vertebrate Genome Project))
- Purging duplicates in one haplotype VGP6b ( (from Dockstore: Vertebrate Genome Project))
- QCxMS Spectra Prediction from SDF ( (from Dockstore: Computational Chemistry, Metabolomics))
- QIIME2 IIa: Denoising (sequence quality control) and feature table creation (single-end) ( (from Dockstore: Metabarcoding))
- QIIME2 IIb: Denoising (sequence quality control) and feature table creation (paired-end) ( (from Dockstore: Metabarcoding))
- QIIME2 Ia: multiplexed data (single-end) ( (from Dockstore: Metabarcoding))
- QIIME2 Ib: multiplexed data (paired-end) ( (from Dockstore: Metabarcoding))
- QIIME2 Ic: Demultiplexed data (single-end) ( (from Dockstore: Metabarcoding))
- QIIME2 Id: Demultiplexed data (paired-end) ( (from Dockstore: Metabarcoding))
- QIIME2 VI: Diversity metrics and estimations ( (from Dockstore: Metabarcoding))
- QIIME2-III-V-Phylogeny-Rarefaction-Taxonomic-Analysis ( (from Dockstore: Metabarcoding))
- RNA Velocity Analysis: Velocyto for 10X Data from Bundled Output ( (from Dockstore: Single Cell))
- RNA Velocity Analysis: Velocyto for 10X Data with Filtered Barcodes ( (from Dockstore: Single Cell))
- Raw Read Quality and Contamination Control For Genome Assembly (none)
- Scaffolding with Hi-C data VGP8 ( (from Dockstore: Vertebrate Genome Project))
- Scaffolding-BioNano-VGP7 ( (from Dockstore: Vertebrate Genome Project))
- Segmentation and counting of cell nuclei in fluorescence microscopy images ( (from Dockstore: Imaging))
- Short-read quality control and trimming (none)
- Single-Cell RNA-seq Analysis: Scanpy Preprocessing and Clustering ( (from Dockstore: Single Cell))
- Taxonomic abundance summary tables for a specified taxonomic rank ( (from Dockstore: Microbiome))
- Taxonomy Profiling and Visualization with Krona ( (from Dockstore: Microbiome))
- core genome Multilocus Sequence Typing (cgMLST) of bacterial genome (none)
- dada2 amplicon analysis pipeline - for paired end data ( (from Dockstore: Metabarcoding))
- dcTMD calculations with GROMACS ( (from Dockstore: Computational Chemistry))
- kmer-profiling-hifi-trio-VGP2 ( (from Dockstore: Vertebrate Genome Project))
- sra_manifest_to_concatenated_fastqs_parallel ( (from Dockstore: Data Fetching))
