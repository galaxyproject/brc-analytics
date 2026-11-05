import { type ExampleGene } from "./types";

// Genes of P. falciparum 3D7 (GCF_000002765.6) in the temporary gene snapshot
// (#1904), shown until a search is made. Gene UIDs are UUID5s of the
// assembly accession and the gene's GFF3 row ID, so they don't change when the
// snapshot is regenerated from the same release.
export const EXAMPLE_GENES: ExampleGene[] = [
  {
    geneUid: "d9049485-ed74-5455-98c2-5dc13eef544a",
    locusTag: "PF3D7_1133400",
    note: "Apical membrane antigen 1",
    symbol: "AMA1",
  },
  {
    geneUid: "f493ed2a-23d9-5f55-90e1-310c3680d495",
    locusTag: "PF3D7_0831800",
    note: "Histidine-rich protein II",
    symbol: "HRP2",
  },
  {
    geneUid: "091bb705-4cc0-5416-8f65-6711ad8248db",
    locusTag: "PF3D7_0930300",
    note: "Merozoite surface protein 1",
    symbol: "MSP1",
  },
  {
    geneUid: "86dfe185-cc1f-577e-991d-100ff28d1c86",
    locusTag: "PF3D7_0304600",
    note: "Circumsporozoite protein",
    symbol: "CSP",
  },
  {
    geneUid: "9ef15f58-60fc-5de4-98b8-7c8cb0169013",
    locusTag: "PF3D7_0105400",
    note: "No symbol; two transcripts and two old locus tags",
    symbol: null,
  },
  {
    geneUid: "c309de32-b052-5136-8696-0e8e599b7cef",
    locusTag: "PF3D7_0203500",
    note: "A tRNA, with no product and no transcript ID",
    symbol: null,
  },
  {
    geneUid: "340d7c74-6ca0-5b0d-a0ed-7d3beefb4f41",
    locusTag: "PF3D7_0100500",
    note: "A transcribed pseudogene",
    symbol: null,
  },
  {
    geneUid: "7b3c7733-2509-5585-995f-694be505af1c",
    locusTag: "PF3D7_0103600",
    note: "Transcript and protein products differ",
    symbol: "PSH1",
  },
  {
    geneUid: "26701dae-095d-55c0-9551-adfd5ea8174f",
    locusTag: "PF3D7_0205700",
    note: "Two transcripts whose proteins have different products",
    symbol: null,
  },
  {
    geneUid: "4747203f-fa09-562d-9f2b-21b204dd662c",
    locusTag: "PF3D7_0112300",
    note: "A ribosomal RNA",
    symbol: null,
  },
  {
    geneUid: "542eba05-f671-5495-94fd-f01e7083c05b",
    locusTag: "PF3D7_0115050",
    note: "A snoRNA",
    symbol: null,
  },
];

// How a search result names each kind of term it matched on.
export const MATCH_TYPE_NAMES: Record<string, string> = {
  locus_tag: "locus tag",
  name: "name",
  ncbi_gene_id: "NCBI Gene ID",
  old_locus_tag: "old locus tag",
  protein_accession: "protein accession",
  protein_product: "protein product",
  symbol: "symbol",
  transcript_id: "transcript ID",
  transcript_product: "transcript product",
};

// The kinds of term whose value is a product: shown in quotes.
export const PRODUCT_MATCH_TYPES = new Set([
  "protein_product",
  "transcript_product",
]);
