# Gene pages: charter

Why we're building BRC gene pages, who they're for and what we're betting on. It's guidance, not a rulebook: keep it in mind when shaping gene pages work. How things work is in the gene catalog contract (Gene catalog: v1 design contract, #1892) and the design documents beside it. Written for #1927.

## In short

BRC gene pages connect genes to analyses, and to everywhere else the gene turns up: other assemblies and public sequencing data. A gene page is where a gene in a workflow's results becomes something a researcher understands, where a question about a gene becomes a workflow run, and where a researcher finds out where else the gene is. For a gene's biology, NCBI Gene, VEuPathDB, UniProt and Ensembl do it better, and gene pages link to them.

## Who it's for

- **A researcher coming out of a workflow.** Their counts table, variant calls or BLAST hits list gene IDs like `PVP01_0910200`. The UCSC GTFs that BRC's workflows run on have no product names, so the table is a column of bare IDs. They need to know what each gene is, from the same annotation their run used.
- **A researcher heading into a workflow.** They start from a gene, say AMA1 in _P. falciparum_ 3D7, and want to run something on it: RNA-seq on its assembly, or variant calling at its locus in public reads. They need the right workflow, with the gene's assembly and annotation already chosen.
- **A researcher comparing assemblies and public data.** They ask whether the gene is in their strain, in its relatives or anywhere in public sequencing data, and whether it's really missing where it seems to be or just never annotated there.
- **An agent working for any of them:** the BRC assistant, or an outside agent through the BRC MCP server.

## Why ours

The other gene pages go deep on one gene in one reference genome. BRC holds 5,505 assemblies and joins them to workflows and to public reads in ENA. Gene pages carry that down to the gene, through links that go:

- **From a workflow:** a gene ID in a result leads to what the gene is and which annotation the run used.
- **Into a workflow:** a gene leads to the workflows that run on its assembly, with the assembly and annotation filled in.
- **Across assemblies:** a gene leads to the same gene on BRC's other assemblies, including the ones where it was never annotated or named (see Unnamed genes on most assemblies, below).
- **Into public reads:** a gene leads, through Logan Search, to the public sequencing runs that contain it (see Logan, below).
- **Out:** for everything else, links to the sources that know it best, with identifiers that resolve there.

Each link is only as good as its detail: which assembly, which annotation and release, and which gene ID in which source. A gene page that names the wrong annotation sends a researcher, or a workflow, to the wrong coordinates. That's why the gene data's lineage gets so much care. On the page it should mostly stay out of sight: one line saying which annotation this is.

### Unnamed genes on most assemblies

Most of BRC's assemblies are thinly annotated. 3,081 of the 5,505 (56%) have no NCBI annotation, only the genes UCSC predicted with AUGUSTUS (`catalog/output/assemblies.json`, 2026-10-30). AUGUSTUS predicts genes from the sequence alone. They're called `g1`, `g2` and so on, with transcripts `g1.t1`, and carry no names, no products and no tie to any known gene. A prediction can also miss a gene, or split or merge genes.

That matters twice over. A workflow run on one of these assemblies gives results in `g` numbers, which tell a researcher nothing. And a gene that seems to be missing from the assembly may be there, just never annotated or never named.

Finding a known gene on such an assembly means placing its sequence there, by aligning its protein or transcript, and seeing which AUGUSTUS prediction it lands on, if any. Each outcome says something:

- **It lands on a prediction.** The prediction gets a name, and results that mention it become readable.
- **It lands where nothing was predicted.** The gene is there but was never annotated.
- **It doesn't land at all.** The gene may really be absent, or may fall in a gap in the assembly.

## What's newly needed

Agents now do much of the finding and reading. What they need from gene data:

- **Grounding.** A symbol, locus tag or old alias resolves to the gene it names on a given assembly. When it names more than one gene there, as some symbols do, the answer lists them all for the agent to choose from, and a gene that isn't there gets a clear "not found". An agent's usual failure is a gene ID that looks plausible but doesn't exist, or coordinates from a different annotation release.
- **Answers it can cite.** Every answer names its snapshot by build ID, so the same question gets the same answer until new gene data is released.
- **A path to action.** Gene, then assembly, compatible workflows, workflow inputs and reads. The BRC MCP server already has most of this path (`get_compatible_workflows`, `resolve_workflow_inputs`, `search_ena`); looking up the gene is the missing first step.

People need the same things on a page. The gene API comes first, and the page is one view of it.

## Logan

[Logan](https://github.com/IndexThePlanet/Logan) is an assembly of nearly every public run in NCBI's Sequence Read Archive (SRA) up to the end of 2023: tens of millions of runs, each reduced to its contigs and indexed by k-mers. BRC's Logan Search takes a sequence of up to 5,000 bases and returns the runs whose contigs share enough of its k-mers, half of them by default. Each run comes with its organism, assay, platform, country, year, BioSample and BioProject.

For gene pages, that takes the comparative question past BRC's own assemblies:

- **Is it in the reads?** Search with the gene and keep the hits from the runs an assembly was built from, which share its BioSample. A hit suggests the gene is in that strain's sequence, even if the assembly missed it or the annotation never named it.
- **Is it in relatives?** Keep the hits from the same organism, or from other strains and isolates, including the many that were sequenced and never assembled.
- **Where in the world is it?** The hosts, places, years and kinds of sample where the gene turns up. For a pathogen gene, that's a view of its spread.
- **Is it expressed?** Search with the spliced transcript against transcriptomic runs. A hit suggests the gene is expressed somewhere, though not how much.
- **Into a workflow.** The hits are SRA runs, which BRC's workflows take as input. Gene, then runs that contain it, then variant calling on those runs against the gene's assembly.

A hit is a candidate, not a finding. Logan matches shared k-mers rather than aligning, so a conserved domain or a related gene can match too. Saying a gene is present or expressed takes a check of that gene, such as aligning it to the hit's contigs.

Logan doesn't search the assemblies themselves today. That needs its GenBank and RefSeq index, which BRC's Logan Search hasn't deployed yet. A search also takes minutes, so it's something a researcher or agent asks for, not something a page does when it loads.

## BioNym

[BioNym](https://github.com/d-callan/bionym), by Danielle Callan, takes any gene identifier and builds a knowledge graph about the gene from public sources: its assemblies, orthologs, annotations and expression datasets, and claims drawn from papers and data. A judge model (TypeSafe's JEV) gives every claim a confidence score, every claim keeps its evidence, and the graph can be asked questions.

BioNym's bet is that agents can gather and weigh the evidence about a gene well enough to rely on. If that holds, it fills what gene pages leave to others: instead of a row of links out, the evidence about the gene, gathered, weighed and cited. It also takes on the hardest comparative question. Where NCBI didn't annotate a gene on a related assembly, BioNym asks whether it's likely there anyway, weighing the assembly's level and completeness.

- **Gene pages give facts; BioNym gives judgments.** The facts come from a pinned snapshot that is refused if it doesn't check out: the gene, its assembly and annotation, its coordinates, the assemblies it's annotated on, and the workflows that run on it. BioNym's claims are judged and scored. Logan's hits, and genes placed on an assembly by alignment, sit between the two: measured matches with a score, not a model's judgment, but not checked facts either. All three can be on a page if each is shown for what it is and the facts are never mixed in with the rest.
- **For genes on BRC assemblies, BRC is BioNym's anchor.** It can start from our gene ID and assembly instead of searching for them.

## Our bets

1. **Researchers reach genes through their analyses more than by browsing.** If not, gene pages are a thinner copy of PlasmoDB. We'd see it in movement between gene pages and workflows, compared with arrivals from search.
2. **Many apparent absences are annotation gaps, not biology.** If so, "is it really missing?" is worth answering across BRC's assemblies. We'd see it in how often a gene that's unannotated on an assembly turns out to be there.
3. **Researchers want to know where a gene turns up in public data:** which hosts, places and samples. We'd see it in how often gene pages lead to a Logan search, and whether those searches lead on to a workflow.
4. **Agents will do a large share of gene lookups.** We'd see it in lookups through the API and MCP server, compared with page views.
5. **Getting the annotation exactly right is what earns trust.** If nobody notices the difference, it's overhead. We'd see it in whether genes from workflow results resolve to pages people use.
6. **Evidence that agents gather and weigh is trusted enough to show.** This is BioNym's bet. We'd see it in whether researchers read that evidence or go straight to the links out.

## Not ours

- **Curating a gene's biology:** function, GO terms, expression, literature, structure and orthologs. NCBI Gene, VEuPathDB, UniProt, Ensembl and OMA do it well. Gene pages link to them, BioNym may gather from them, and the gene snapshot doesn't copy them.
- **Being a genome browser.** A gene's location links to the UCSC Genome Browser.

## Rule of thumb

Does it help someone, a person or an agent, get from a gene to an analysis, understand a result from one, or find the gene elsewhere, on another assembly or in public data? Then it's probably ours. If it's about the gene's biology in general, link out, or leave it to evidence such as BioNym gathers.

## How we'll know it's working

- People move between gene pages and workflows, in both directions.
- People follow a gene across assemblies and into Logan searches.
- Agents' gene lookups resolve, and some of them end in a workflow run.
- Page views alone don't tell us much.
