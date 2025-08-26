import {
  ComponentConfig,
  FloatingConfig,
} from "@databiosphere/findable-ui/lib/config/entities";
import { StyledViewSupport } from "../../../../app/components/Support/components/ViewSupport/viewSupport.styles";

export const floating: FloatingConfig = {
  components: [
    {
      component: StyledViewSupport,
      props: {
        url: "https://docs.google.com/forms/d/e/1FAIpQLSd8f5hrd1-ECgPUbS5dL9njoU1nvCSN5ukykKk9mF6WAyTh6A/viewform?usp=sf_link",
      },
    } as ComponentConfig<typeof StyledViewSupport>,
  ],
};
