import {
  ComponentConfig,
  ComponentsConfig,
} from "@databiosphere/findable-ui/lib/config/entities";
import * as C from "../../../../../app/components";
import * as V from "../../../../../app/viewModelBuilders/catalog/brc-analytics-catalog/common/viewModelBuilders";
import { Outbreak } from "../../../../../app/apis/catalog/brc-analytics-catalog/common/entities";
import { FluidPaper } from "../../../../../app/components/common/Paper/components/FluidPaper/fluidPaper";
import { KeyValueSection } from "../../../../../app/components/Entity/components/Section/KeyValueSection/keyValueSection";

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
