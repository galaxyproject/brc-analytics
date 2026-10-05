import type { Outbreak } from "@brc/apis/outbreak";
import { config } from "@brc/config/config";
import { BRC_PAGE_META } from "@brc/meta/constants";
import { PriorityPathogensView } from "@brc/views/PriorityPathogensView/priorityPathogensView";
import { Main as DXMain } from "@databiosphere/findable-ui/lib/components/Layout/components/Main/main.styles";
import { seedDatabase } from "@databiosphere/findable-ui/lib/utils/seedDatabase";
import type { EntitiesResponse } from "@repo/shared/services/staticGeneration/entities/types";
import { getEntities } from "@repo/shared/services/staticGeneration/entities/utils";
import type { Props as EntitiesPageProps } from "@repo/shared/views/EntitiesView/types";
import { type GetStaticProps } from "next";
import { type JSX } from "react";

const ENTITY_LIST_TYPE = "priority-pathogens";

interface PriorityPathogensPageProps extends EntitiesPageProps {
  data: EntitiesResponse<Outbreak>;
}

/**
 * Priority pathogens explore page.
 * @param props - Page props.
 * @param props.data - Priority pathogens data.
 * @returns PriorityPathogensView component.
 */
const Page = ({ data }: PriorityPathogensPageProps): JSX.Element => {
  return <PriorityPathogensView data={data} />;
};

/**
 * Build the set of props for pre-rendering of page.
 * @returns static props.
 */
export const getStaticProps: GetStaticProps<
  PriorityPathogensPageProps
> = async () => {
  const entityConfig = config().entities.find(
    ({ route }) => route === ENTITY_LIST_TYPE
  );

  // The route may be absent from a site's entity config; return notFound when it is.
  if (!entityConfig) return { notFound: true };

  await seedDatabase(ENTITY_LIST_TYPE, entityConfig);
  const data = await getEntities<Outbreak>(entityConfig);

  return {
    props: {
      data,
      entityListType: ENTITY_LIST_TYPE,
      ...BRC_PAGE_META.PRIORITY_PATHOGENS,
    },
  };
};

export default Page;

Page.Main = DXMain;
