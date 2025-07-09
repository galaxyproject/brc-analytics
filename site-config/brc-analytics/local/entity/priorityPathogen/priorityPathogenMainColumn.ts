import {
  ComponentsConfig,
  ComponentConfig,
} from "@databiosphere/findable-ui/lib/config/entities";
import * as C from "../../../../../app/components";
import * as V from "../../../../../app/viewModelBuilders/catalog/brc-analytics-catalog/common/viewModelBuilders";
import { ResourcesSection } from "../../../../../app/views/PriorityPathogenView/components/ResourcesSection/resourcesSection";
import { Outbreak } from "../../../../../app/apis/catalog/brc-analytics-catalog/common/entities";

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
