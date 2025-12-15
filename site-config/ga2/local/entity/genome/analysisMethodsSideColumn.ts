import {
  ComponentConfig,
  ComponentsConfig,
} from "@databiosphere/findable-ui/lib/config/entities";
import * as C from "../../../../../app/components";
import * as V from "../../../../../app/viewModelBuilders/catalog/brc-analytics-catalog/common/viewModelBuilders";
import * as V_GA2 from "../../../../../app/viewModelBuilders/catalog/ga2/viewModelBuilders";
import { GA2AssemblyEntity } from "../../../../../app/apis/catalog/ga2/entities";

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
                        component: C.OrganismAvatar,
                        viewBuilder: V_GA2.buildOrganismImage,
                      } as ComponentConfig<
                        typeof C.OrganismAvatar,
                        GA2AssemblyEntity
                      >,
                      {
                        component: C.KeyValuePairs,
                        viewBuilder: V.buildAssemblyDetails,
                      } as ComponentConfig<
                        typeof C.KeyValuePairs,
                        GA2AssemblyEntity
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
                    GA2AssemblyEntity
                  >,
                ],
                component: C.GridPaperSection,
              },
            ],
            component: C.GridPaper,
          },
        ],
        component: C.FluidPaper,
      } as ComponentConfig<typeof C.FluidPaper, GA2AssemblyEntity>,
    ],
    component: C.BackPageContentSideColumn,
  } as ComponentConfig<typeof C.BackPageContentSideColumn, GA2AssemblyEntity>,
];
