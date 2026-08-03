import { type Outbreak } from "@/apis/catalog/brc-analytics-catalog/common/entities";
import * as V from "@/viewModelBuilders/catalog/brc-analytics-catalog/common/viewModelBuilders";
import { ResourcesSection } from "@brc/views/PriorityPathogenView/components/ResourcesSection/resourcesSection";
import { MDXSection } from "@brc/views/PriorityPathogenView/ui/Section/MDXSection/mdxSection";
import { BackPageContentMainColumn } from "@databiosphere/findable-ui/lib/components/Layout/components/BackPage/backPageView.styles";
import {
  type ComponentConfig,
  type ComponentsConfig,
} from "@databiosphere/findable-ui/lib/config/entities";

export const priorityPathogenMainColumn: ComponentsConfig = [
  {
    children: [
      {
        component: MDXSection,
        viewBuilder: V.buildPriorityPathogenDescription,
      } as ComponentConfig<typeof MDXSection, Outbreak>,
      {
        component: ResourcesSection,
        viewBuilder: V.buildPriorityPathogenResources,
      } as ComponentConfig<typeof ResourcesSection, Outbreak>,
    ],
    component: BackPageContentMainColumn,
  },
];
