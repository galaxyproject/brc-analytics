import { Main as DXMain } from "@databiosphere/findable-ui/lib/components/Layout/components/Main/main.styles";
import { config } from "@ga2/config/config";
import { GA2_PAGE_META } from "@ga2/meta/constants";
import { EntityDataGate } from "@repo/shared/components/EntityDataGate/entityDataGate";
import { type PageMeta } from "@repo/shared/meta/types";
import { makeEntitiesStaticPaths } from "@repo/shared/services/staticGeneration/entities/staticPaths";
import { makeEntitiesStaticProps } from "@repo/shared/services/staticGeneration/entities/staticProps";
import { type EntitiesPageProps } from "@repo/shared/services/staticGeneration/entities/types";
import { EntitiesView } from "@repo/shared/views/EntitiesView/entitiesView";
import { type JSX } from "react";

const ENTITY_LIST_META: Record<string, PageMeta> = {
  assemblies: GA2_PAGE_META.ASSEMBLIES,
  organisms: GA2_PAGE_META.ORGANISMS,
};

const Page = ({ entityListType, ...props }: EntitiesPageProps): JSX.Element => {
  if (!entityListType) return <></>;

  return (
    <EntityDataGate>
      <EntitiesView entityListType={entityListType} {...props} />
    </EntityDataGate>
  );
};

// Only entities with page metadata get an explore list page (workflows has its
// own page). Passing ENTITY_LIST_META keeps the generated paths and props
// aligned with the metadata.
export const getStaticPaths = makeEntitiesStaticPaths(
  config,
  Object.keys(ENTITY_LIST_META)
);

export const getStaticProps = makeEntitiesStaticProps(ENTITY_LIST_META);

export default Page;

Page.Main = DXMain;
