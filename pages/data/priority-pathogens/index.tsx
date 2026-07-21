import { getEntityListMeta } from "@/common/meta/utils";
import { EntityDataGate } from "@/components/EntityDataGate/entityDataGate";
import { config } from "@/config/config";
import { PriorityPathogensView } from "@/views/PriorityPathogensView/priorityPathogensView";
import { Main as DXMain } from "@databiosphere/findable-ui/lib/components/Layout/components/Main/main.styles";
import { GetStaticProps } from "next";
import { JSX } from "react";

const ENTITY_LIST_TYPE = "priority-pathogens";

interface Props {
  entityListType: string;
  pageDescription?: string;
  pageTitle?: string;
}

/**
 * Priority pathogens explore page. Sources its data from the client-loaded
 * entity store (gated on the store being loaded).
 * @returns PriorityPathogensView component.
 */
const Page = (): JSX.Element => (
  <EntityDataGate>
    <PriorityPathogensView />
  </EntityDataGate>
);

/**
 * Build the set of props for pre-rendering of page.
 * @returns static props.
 */
export const getStaticProps: GetStaticProps<Props> = async () => {
  const appConfig = config();
  const entityConfig = appConfig.entities.find(
    ({ route }) => route === ENTITY_LIST_TYPE
  );

  // The route may be absent from a site's entity config; return notFound when it is.
  if (!entityConfig) return { notFound: true };

  const entityMeta = getEntityListMeta(appConfig.appKey)[ENTITY_LIST_TYPE];

  return {
    props: {
      entityListType: ENTITY_LIST_TYPE,
      pageDescription: entityMeta?.pageDescription,
      pageTitle: entityMeta?.pageTitle,
    },
  };
};

Page.Main = DXMain;

export default Page;
