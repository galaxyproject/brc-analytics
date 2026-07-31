import {
  type ComponentConfig,
  type FloatingConfig,
} from "@databiosphere/findable-ui/lib/config/entities";
import { StyledViewSupport } from "@ga2/components/layout/ViewSupport/viewSupport.styles";

export const floating: FloatingConfig = {
  components: [
    {
      component: StyledViewSupport,
      props: {
        url: "https://forms.gle/6sqBCiKPCPTg6q1k9",
      },
    } as ComponentConfig<typeof StyledViewSupport>,
  ],
};
