import { Outbreak } from "@/apis/catalog/brc-analytics-catalog/common/entities";
import * as C from "@/components";
import * as V from "@/viewModelBuilders/catalog/brc-analytics-catalog/common/viewModelBuilders";
import { KeyValueSection } from "@/views/PriorityPathogenView/ui/Section/KeyValueSection/keyValueSection";
import { FluidPaper } from "@brc-analytics/core/components/Paper/components/FluidPaper/fluidPaper";
import {
  ComponentConfig,
  ComponentsConfig,
} from "@databiosphere/findable-ui/lib/config/entities";

export const priorityPathogenSideColumn: ComponentsConfig = [
  {
    children: [
      {
        children: [
          {
            component: KeyValueSection,
            viewBuilder: V.buildPriorityPathogenDetails,
          } as ComponentConfig<typeof KeyValueSection, Outbreak>,
        ],
        component: C.Sections,
        props: { Paper: FluidPaper },
      } as ComponentConfig<typeof C.Sections, Outbreak>,
    ],
    component: C.BackPageContentSideColumn,
  },
];
