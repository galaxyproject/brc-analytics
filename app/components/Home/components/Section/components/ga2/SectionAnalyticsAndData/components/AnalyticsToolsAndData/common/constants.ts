import { CardProps as DXCardProps } from "@databiosphere/findable-ui/lib/components/common/Card/card";
import { URLS } from "../../../../../../../../common/constants";

const CARD_ACTION_LABEL = {
  LEARN_MORE: "Learn More",
};
const CARD_TEXT = {
  ABOUT_EARTH_BIOGENOME_PROJECT:
    "A global initiative to sequence, catalog, and characterize the genomes of all of Earth's eukaryotic biodiversity",
  ABOUT_GALAXY:
    "A platform for the analysis of data at any scale using public infrastructure",
  ABOUT_JETSTREAM2:
    "A flexible, user-friendly cloud computing environment",
  ABOUT_NCBI: "A singular source for standardized genomic and functional data",
  ABOUT_T2T: "An open, community-based effort to generate the first complete assenbky of a human genome",
  ABOUT_TACC: "One of the world’s leading academic computing centers",
  ABOUT_UCSC:
    "A global platform for visualization and interpretation of genomic data",
  ABOUT_VGP:
    "Aims to generate near error-free reference genome assemblies of ~70,000 extant vertebrate species",
};

export const ANALYTICS_TOOLS: DXCardProps[] = [
  {
    cardActions: [
      {
        label: CARD_ACTION_LABEL.LEARN_MORE,
        url: URLS.EARTH_BIOGENOME_PROJECT,
      },
    ],
    media: {
      alt: "Earth BioGenome Project",
      height: 40,
      src: "/portals/earth.png",
    },
    text: CARD_TEXT.ABOUT_EARTH_BIOGENOME_PROJECT,
    title: "Earth BioGenome Project",
  },
  {
    cardActions: [
      {
        label: CARD_ACTION_LABEL.LEARN_MORE,
        url: URLS.VERTEBRATE_GENOMES_PROJECT,
      },
    ],
    media: {
      alt: "Vertebrate Genomes Project",
      height: 40,
      src: "/portals/vgp.png",
    },
    text: CARD_TEXT.ABOUT_VGP,
    title: "Vertebrate Genomes Project",
  },
  {
    cardActions: [
      {
        label: CARD_ACTION_LABEL.LEARN_MORE,
        url: URLS.GALAXY_SYSTEM_VGP,
      },
    ],
    media: {
      alt: "Telomere-to-Telomere",
      height: 40,
      src: "/portals/t2t.png",
    },
    text: CARD_TEXT.ABOUT_T2T,
    title: "Telomere-to-Telomere",
  },
  {
    cardActions: [
      {
        label: CARD_ACTION_LABEL.LEARN_MORE,
        url: URLS.GALAXY_SYSTEM_VGP,
      },
    ],
    media: {
      alt: "Galaxy",
      height: 40,
      src: "/portals/galaxy.png",
    },
    text: CARD_TEXT.ABOUT_GALAXY,
    title: "Galaxy",
  },
  {
    cardActions: [
      {
        label: CARD_ACTION_LABEL.LEARN_MORE,
        url: URLS.NCBI_DATASETS,
      },
    ],
    media: {
      alt: "NCBI Datasets",
      height: 40,
      src: "/portals/ncbi.png",
    },
    text: CARD_TEXT.ABOUT_NCBI,
    title: "NCBI Datasets",
  },
  {
    cardActions: [
      {
        label: CARD_ACTION_LABEL.LEARN_MORE,
        url: URLS.UCSC_GENOME_BROWSER,
      },
    ],
    media: {
      alt: "UCSC Genome Browser",
      height: 40,
      src: "/portals/ucsc.png",
    },
    text: CARD_TEXT.ABOUT_UCSC,
    title: "UCSC Genome Browser",
  },
  {
    cardActions: [
      {
        label: CARD_ACTION_LABEL.LEARN_MORE,
        url: URLS.TACC,
      },
    ],
    media: {
      alt: "TACC",
      height: 40,
      src: "/portals/tacc.png",
    },
    text: CARD_TEXT.ABOUT_TACC,
    title: "TACC",
  },
  {
    cardActions: [
      {
        label: CARD_ACTION_LABEL.LEARN_MORE,
        url: URLS.JETSTREAM2,
      },
    ],
    media: {
      alt: "Jetstream2",
      height: 40,
      src: "/portals/jetstream2.png",
    },
    text: CARD_TEXT.ABOUT_JETSTREAM2,
    title: "Jetstream2",
  },
];
