import { URLS } from "@brc/views/HomeView/urls";
import { type AnalyticsCard } from "@repo/shared/views/HomeView/components/Section/components/SectionAnalytics/components/AnalyticsTools/types";

const CARD_ACTION_LABEL = {
  LEARN_MORE: "Learn More",
};
const CARD_TEXT = {
  ABOUT_GALAXY:
    "A platform for the analysis of data at any scale using public infrastructure",
  ABOUT_NCBI: "A singular source for standardized genomic and functional data",
  ABOUT_TACC: "One of the world’s leading academic computing centers",
  ABOUT_UCSC:
    "A global platform for visualization and interpretation of genomic data",
};

export const ANALYTICS_TOOLS: AnalyticsCard[] = [
  {
    cardActions: [
      {
        label: CARD_ACTION_LABEL.LEARN_MORE,
        url: URLS.GALAXY_SYSTEM,
      },
    ],
    id: "galaxy",
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
    id: "ncbi-datasets",
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
    id: "ucsc-genome-browser",
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
    id: "tacc",
    media: {
      alt: "TACC",
      height: 40,
      src: "/portals/tacc.png",
    },
    text: CARD_TEXT.ABOUT_TACC,
    title: "TACC",
  },
];
