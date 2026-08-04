import { type Outbreak } from "@/apis/catalog/brc-analytics-catalog/common/entities";
import { KeyValueSection } from "@/components/Entity/components/Section/KeyValueSection/keyValueSection";
import { Sections } from "@/components/Entity/components/Sections/sections";
import * as V from "@/viewModelBuilders/catalog/brc-analytics-catalog/common/viewModelBuilders";
import { BackPageContentSideColumn } from "@databiosphere/findable-ui/lib/components/Layout/components/BackPage/backPageView.styles";
import {
  type ComponentConfig,
  type ComponentsConfig,
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
        component: Sections,
        props: { Paper: FluidPaper },
      } as ComponentConfig<typeof Sections, Outbreak>,
    ],
    component: BackPageContentSideColumn,
  },
];
