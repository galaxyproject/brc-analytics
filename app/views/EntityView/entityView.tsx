import { JSX } from "react";
import { ComponentCreator } from "@databiosphere/findable-ui/lib/components/ComponentCreator/ComponentCreator";
import { Detail } from "@databiosphere/findable-ui/lib/components/Detail/detail";
import { useCurrentDetailTab } from "@databiosphere/findable-ui/lib/hooks/useCurrentDetailTab";
import { useEntityHeadTitle } from "@databiosphere/findable-ui/lib/hooks/useEntityHeadTitle";
import { useFetchEntity } from "@databiosphere/findable-ui/lib/hooks/useFetchEntity";
import { ComponentsConfig } from "@databiosphere/findable-ui/lib/config/entities";
import Head from "next/head";
import { Fragment } from "react";
import { AppBackPageTabConfig } from "../../../site-config/common/entities";

export interface EntityViewProps<R> {
  data?: R;
  entityListType: string;
}

export const EntityDetailView = <R,>(
  props: EntityViewProps<R>
): JSX.Element => {
  const { currentTab } = useCurrentDetailTab();
  const { response } = useFetchEntity(props);
  const { mainColumn, sideColumn, top } = currentTab as AppBackPageTabConfig;
  const title = useEntityHeadTitle(response);
  return (
    <Fragment>
      {title && (
        <Head>
          <title>{title}</title>
        </Head>
      )}
      <Detail
        isDetailOverview={false}
        mainColumn={renderComponents(mainColumn, response)}
        sideColumn={renderComponents(sideColumn, response)}
        Tabs={null}
        top={renderComponents(top, response)}
      />
    </Fragment>
  );
};

/**
 * Renders components with given response data.
 * @param components - Components configuration.
 * @param response - Response.
 * @returns rendered components.
 */
function renderComponents<R>(
  components?: ComponentsConfig,
  response?: R
): JSX.Element | null {
  if (!response) return null;
  if (!components) return null;
  return <ComponentCreator components={components} response={response} />;
}
