import { URLS } from "@/components/Home/common/constants";
import { CardProps as DXCardProps } from "@databiosphere/findable-ui/lib/components/common/Card/card";

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

export const ANALYTICS_TOOLS: DXCardProps[] = [
  {
    cardActions: [
      {
        label: CARD_ACTION_LABEL.LEARN_MORE,
        url: URLS.GALAXY_SYSTEM,
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
];
