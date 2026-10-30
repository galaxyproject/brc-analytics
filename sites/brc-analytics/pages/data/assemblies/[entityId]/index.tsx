import { type BRCDataCatalogGenome } from "@brc/apis/assembly";
import { config } from "@brc/config/config";
import { BRC_PAGE_META } from "@brc/meta/constants";
import { Side as BRCSide } from "@brc/views/EntityView/assembly/components/Side/brc/side";
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
}: EntityPageProps<BRCDataCatalogGenome>): JSX.Element => {
  if (!data) return <></>;

  return (
    <AssemblyView SideComponent={BRCSide} assembly={data} entityId={entityId} />
  );
};

export const getStaticPaths = makeEntityStaticPaths(config, ENTITY_LIST_TYPE);

export const getStaticProps = makeEntityStaticProps<BRCDataCatalogGenome>(
  config,
  ENTITY_LIST_TYPE,
  BRC_PAGE_META.ASSEMBLY_DETAIL
);

export default Page;
