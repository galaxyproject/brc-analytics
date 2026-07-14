import { Outbreak } from "@/apis/catalog/brc-analytics-catalog/common/entities";
import * as C from "@/components";
import * as V from "@/viewModelBuilders/catalog/brc-analytics-catalog/common/viewModelBuilders";
import { ResourcesSection } from "@/views/PriorityPathogenView/components/ResourcesSection/resourcesSection";
import {
  ComponentConfig,
  ComponentsConfig,
} from "@databiosphere/findable-ui/lib/config/entities";

export const priorityPathogenMainColumn: ComponentsConfig = [
  {
    children: [
      {
        component: C.MDXSection,
        viewBuilder: V.buildPriorityPathogenDescription,
      } as ComponentConfig<typeof C.MDXSection, Outbreak>,
      {
        component: ResourcesSection,
        viewBuilder: V.buildPriorityPathogenResources,
      } as ComponentConfig<typeof ResourcesSection, Outbreak>,
    ],
    component: C.BackPageContentMainColumn,
  },
];
