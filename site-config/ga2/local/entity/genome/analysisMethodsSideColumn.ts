import {
  ComponentConfig,
  ComponentsConfig,
} from "@databiosphere/findable-ui/lib/config/entities";
import { BRCDataCatalogGenome } from "../../../../../app/apis/catalog/brc-analytics-catalog/common/entities";
import * as C from "../../../../../app/components";
import * as V from "../../../../../app/viewModelBuilders/catalog/brc-analytics-catalog/common/viewModelBuilders";

export const sideColumn: ComponentsConfig = [
  {
    children: [
      {
        children: [
          {
            children: [
              {
                children: [
                  {
                    children: [
                      {
                        component: C.SectionTitle,
                        props: {
                          title: "Assembly Details",
                        },
                      } as ComponentConfig<typeof C.SectionTitle>,
                      {
                        component: C.KeyValuePairs,
                        viewBuilder: V.buildAssemblyDetails,
                      } as ComponentConfig<
                        typeof C.KeyValuePairs,
                        BRCDataCatalogGenome
                      >,
                    ],
                    component: C.Grid,
                    props: {
                      gridSx: { gap: 4 },
                    },
                  } as ComponentConfig<typeof C.Grid>,
                ],
                component: C.GridPaperSection,
              },
              {
                children: [
                  {
                    component: C.SectionTitle,
                    props: {
                      title: "Resources",
                    },
                  } as ComponentConfig<typeof C.SectionTitle>,
                  {
                    component: C.AnalysisPortals,
                    viewBuilder: V.buildGenomeAnalysisPortals,
                  } as ComponentConfig<
                    typeof C.AnalysisPortals,
                    BRCDataCatalogGenome
                  >,
                ],
                component: C.GridPaperSection,
              },
            ],
            component: C.GridPaper,
          },
        ],
        component: C.FluidPaper,
      } as ComponentConfig<typeof C.FluidPaper>,
    ],
    component: C.BackPageContentSideColumn,
  },
];
