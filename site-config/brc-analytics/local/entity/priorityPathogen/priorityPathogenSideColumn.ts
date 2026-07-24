import { Outbreak } from "@/apis/catalog/brc-analytics-catalog/common/entities";
import * as C from "@/components";
import { KeyValueSection } from "@/components/Entity/components/Section/KeyValueSection/keyValueSection";
import * as V from "@/viewModelBuilders/catalog/brc-analytics-catalog/common/viewModelBuilders";
import {
  ComponentConfig,
  ComponentsConfig,
} from "@databiosphere/findable-ui/lib/config/entities";
import { FluidPaper } from "@repo/shared/components/Paper/components/FluidPaper/fluidPaper";

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
