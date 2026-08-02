import { StyledViewSupport } from "@brc/components/layout/ViewSupport/viewSupport.styles";
import {
  type ComponentConfig,
  type FloatingConfig,
} from "@databiosphere/findable-ui/lib/config/entities";
import { SUPPORT_URL } from "@site-config/brc-analytics/local/constants";

export const floating: FloatingConfig = {
  components: [
    {
      component: StyledViewSupport,
      props: {
        url: SUPPORT_URL,
      },
    } as ComponentConfig<typeof StyledViewSupport>,
  ],
};
