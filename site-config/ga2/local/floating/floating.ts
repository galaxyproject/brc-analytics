import { StyledViewSupport } from "@/components/Support/components/ViewSupport/ga2/viewSupport.styles";
import {
  ComponentConfig,
  FloatingConfig,
} from "@databiosphere/findable-ui/lib/config/entities";

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
