import { type GeneRecord } from "./types";

export const GENE_FIXTURE: GeneRecord[] = [
  {
    aliases: ["PF11_0344", "MAL11P1.308"],
    assemblyAccession: "GCF_000002765.6",
    geneId: "PF3D7_1133400",
    geneUid: "pf3d7-1133400",
    location: "chr11:1,293,957-1,296,826 (+)",
    organism: "Plasmodium falciparum 3D7",
    predicted: false,
    product: "apical membrane antigen 1",
    publisher: "NCBI RefSeq",
    release: "GCF_000002765.6-RS_2024_08",
    symbol: "AMA1",
  },
  {
    aliases: ["PBANKA_0831100"],
    assemblyAccession: "GCF_000002765.6",
    geneId: "PF3D7_0831800",
    geneUid: "pf3d7-0831800",
    location: "chr8:1,374,202-1,376,988 (-)",
    organism: "Plasmodium falciparum 3D7",
    predicted: false,
    product: "histidine-rich protein 2",
    publisher: "NCBI RefSeq",
    release: "GCF_000002765.6-RS_2024_08",
    symbol: "HRP2",
  },
  {
    aliases: [],
    assemblyAccession: "GCF_000002415.2",
    geneId: "PVX_099980",
    geneUid: "pvx-099980",
    location: "chr7:1,157,742-1,163,137 (+)",
    organism: "Plasmodium vivax Sal-1",
    predicted: false,
    product: "merozoite surface protein 1",
    publisher: "NCBI RefSeq",
    release: "GCF_000002415.2-RS_2024_08",
    symbol: "MSP1",
  },
  {
    aliases: ["PBANKA_0000011"],
    assemblyAccession: "GCF_000002765.6",
    geneId: "PF3D7_0100100",
    geneUid: "pf3d7-0100100",
    location: "chr1:29,510-37,126 (+)",
    organism: "Plasmodium falciparum 3D7",
    predicted: false,
    product: "erythrocyte membrane protein 1 (PfEMP1)",
    publisher: "NCBI RefSeq",
    release: "GCF_000002765.6-RS_2024_08",
    symbol: "VAR",
  },
];

export function findGeneByUid(uid: string): GeneRecord | undefined {
  return GENE_FIXTURE.find((gene) => gene.geneUid === uid);
}

export const EXAMPLE_GENE_IDS = [
  "PF3D7_1133400",
  "AMA1",
  "PF11_0344",
  "PVX_099980",
];
