import { type GA2AssemblyEntity } from "@ga2/apis/assembly";
import { config } from "@ga2/config/config";
import { GA2_PAGE_META } from "@ga2/meta/constants";
import { Side as GA2Side } from "@ga2/views/EntityView/assembly/components/Side/ga2/side";
import { makeEntityStaticPaths } from "@repo/shared/services/staticGeneration/entity/staticPaths";
import { makeEntityStaticProps } from "@repo/shared/services/staticGeneration/entity/staticProps";
import type { EntityPageProps } from "@repo/shared/services/staticGeneration/entity/types";
import { AssemblyView } from "@repo/shared/views/AssemblyView/assemblyView";
import { type JSX } from "react";

const ENTITY_LIST_TYPE = "assemblies";

/**
 * Assembly detail page. Prerendered in full: the assembly record arrives via
 * props, so no entity list is loaded.
 * @param props - Page props.
 * @param props.data - Assembly.
 * @param props.entityId - Assembly entity ID.
 * @returns Assembly detail page.
 */
const Page = ({
  data,
  entityId,
}: EntityPageProps<GA2AssemblyEntity>): JSX.Element => {
  if (!data) return <></>;

  return (
    <AssemblyView SideComponent={GA2Side} assembly={data} entityId={entityId} />
  );
};

export const getStaticPaths = makeEntityStaticPaths(config, ENTITY_LIST_TYPE);

export const getStaticProps = makeEntityStaticProps<GA2AssemblyEntity>(
  config,
  ENTITY_LIST_TYPE,
  GA2_PAGE_META.ASSEMBLY_DETAIL
);

export default Page;
