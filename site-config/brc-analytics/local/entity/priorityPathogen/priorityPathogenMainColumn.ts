import { type Outbreak } from "@brc/apis/outbreak";
import * as V from "@brc/viewModelBuilders/viewModelBuilders";
import { ResourcesSection } from "@brc/views/PriorityPathogenView/components/ResourcesSection/resourcesSection";
import { MDXSection } from "@brc/views/PriorityPathogenView/ui/Section/MDXSection/mdxSection";
import {
  type ComponentConfig,
  type ComponentsConfig,
} from "@databiosphere/findable-ui/lib/config/entities";

export const priorityPathogenMainColumn: ComponentsConfig = [
  {
    component: MDXSection,
    viewBuilder: V.buildPriorityPathogenDescription,
  } as ComponentConfig<typeof MDXSection, Outbreak>,
  {
    component: ResourcesSection,
    viewBuilder: V.buildPriorityPathogenResources,
  } as ComponentConfig<typeof ResourcesSection, Outbreak>,
];
