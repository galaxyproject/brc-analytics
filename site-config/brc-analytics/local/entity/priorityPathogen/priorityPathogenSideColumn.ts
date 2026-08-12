import * as V from "@brc/viewModelBuilders/viewModelBuilders";
import { type ComponentsConfig } from "@databiosphere/findable-ui/lib/config/entities";
import { KeyValueSection } from "@repo/shared/views/EntityView/components/KeyValueSection/keyValueSection";
import { StyledFluidPaper } from "@repo/shared/views/EntityView/ui/styles";

export const priorityPathogenSideColumn: ComponentsConfig = [
  {
    children: [
      {
        component: KeyValueSection,
        viewBuilder: V.buildPriorityPathogenDetails,
      },
    ],
    component: StyledFluidPaper,
  },
];
