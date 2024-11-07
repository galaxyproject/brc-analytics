import { ALERT_PROPS } from "@databiosphere/findable-ui/lib/components/common/Alert/constants";
import {
  ComponentConfig,
  ComponentsConfig,
} from "@databiosphere/findable-ui/lib/config/entities";
import { SIZE } from "@databiosphere/findable-ui/lib/styles/common/constants/size";
import * as C from "../../../../app/components";
import * as MDX from "../../../../app/components/EntityList/components/Organisms/content/index";

export const listHero: ComponentsConfig = [
  {
    component: MDX.OrganismsWarning,
    props: {
      ...ALERT_PROPS.STANDARD_WARNING,
      component: C.FluidPaper,
      size: SIZE.LARGE,
    },
  } as ComponentConfig<typeof MDX.OrganismsWarning>,
];
