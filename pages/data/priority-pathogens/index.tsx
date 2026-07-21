import type {
  EntitiesResponse,
  Outbreak,
} from "@/apis/catalog/brc-analytics-catalog/common/entities";
import { getEntityListMeta } from "@/common/meta/utils";
import { config } from "@/config/config";
import { seedDatabase } from "@/utils/seedDatabase";
import { PriorityPathogensView } from "@/views/PriorityPathogensView/priorityPathogensView";
import { Main as DXMain } from "@databiosphere/findable-ui/lib/components/Layout/components/Main/main.styles";
import { getEntityService } from "@databiosphere/findable-ui/lib/hooks/useEntityService";
import { GetStaticProps } from "next";
import { JSX } from "react";

const ENTITY_LIST_TYPE = "priority-pathogens";

interface PriorityPathogensPageProps {
  data: EntitiesResponse<Outbreak>;
  pageDescription?: string;
  pageTitle?: string;
}

/**
 * Priority pathogens explore page.
 * @param props - Page props.
 * @param props.data - Priority pathogens data.
 * @returns PriorityPathogensView component.
 */
const PriorityPathogensPage = ({
  data,
}: PriorityPathogensPageProps): JSX.Element => {
  return <PriorityPathogensView data={data} />;
};

/**
 * Build the set of props for pre-rendering of page.
 * @returns static props.
 */
export const getStaticProps: GetStaticProps<
  PriorityPathogensPageProps
> = async () => {
  const appConfig = config();
  const entityConfig = appConfig.entities.find(
    ({ route }) => route === ENTITY_LIST_TYPE
  );

  // The route may be absent from a site's entity config; return notFound when it is.
  if (!entityConfig) return { notFound: true };

  const { fetchAllEntities } = getEntityService(entityConfig, undefined);
  await seedDatabase(ENTITY_LIST_TYPE, entityConfig);
  const data = (await fetchAllEntities(
    ENTITY_LIST_TYPE,
    undefined
  )) as EntitiesResponse<Outbreak>;

  const entityMeta = getEntityListMeta(appConfig.appKey)[ENTITY_LIST_TYPE];

  return {
    props: {
      data,
      pageDescription: entityMeta?.pageDescription,
      pageTitle: entityMeta?.pageTitle,
    },
  };
};

PriorityPathogensPage.Main = DXMain;

export default PriorityPathogensPage;
