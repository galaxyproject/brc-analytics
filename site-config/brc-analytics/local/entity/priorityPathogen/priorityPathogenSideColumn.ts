import { type Outbreak } from "@brc/apis/outbreak";
import * as V from "@brc/viewModelBuilders/viewModelBuilders";
import { KeyValueSection } from "@brc/views/PriorityPathogenView/ui/Section/KeyValueSection/keyValueSection";
import { Sections } from "@brc/views/PriorityPathogenView/ui/Sections/sections";
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
