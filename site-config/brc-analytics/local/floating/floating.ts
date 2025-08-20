import {
  ComponentConfig,
  FloatingConfig,
} from "@databiosphere/findable-ui/lib/config/entities";
import { MinimizableChat } from "../../../../app/components/Chat/components/MinimizableChat";

export const floating: FloatingConfig = {
  components: [
    {
      component: MinimizableChat,
      props: {
        initiallyMinimized: true,
      },
    } as ComponentConfig<typeof MinimizableChat>,
  ],
};
