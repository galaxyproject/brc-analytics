import { EntityConfig } from "@databiosphere/findable-ui/lib/config/entities";
import { getEntityConfig } from "@databiosphere/findable-ui/lib/config/utils";
import { GetStaticPaths, GetStaticProps, GetStaticPropsContext } from "next";
import { ParsedUrlQuery } from "querystring";
import { BRCDataCatalogGenome } from "../../../app/apis/catalog/brc-analytics-catalog/common/entities";
import { GA2AssemblyEntity } from "../../../app/apis/catalog/ga2/entities";
import { config } from "../../../app/config/config";
import { StyledBrowserMain } from "../../../app/components/Layout/components/Main/main.styles";
import { BrowserView } from "../../../app/views/BrowserView/browserView";
import { getEntity } from "../../../app/utils/entityUtils";
import { seedDatabase } from "../../../app/utils/seedDatabase";
import { getEntities } from "../../../app/utils/entityUtils";
import { EntitiesResponse } from "../../../app/apis/catalog/brc-analytics-catalog/common/entities";

interface PageUrl extends ParsedUrlQuery {
  entityId: string;
}

export interface BrowserPageProps {
  assembly: BRCDataCatalogGenome | GA2AssemblyEntity;
  entityId: string;
}

/**
 * Browser page component for displaying JBrowse genome browser.
 * @param props - Browser page props.
 * @returns Browser view component.
 */
const BrowserPage = (props: BrowserPageProps): JSX.Element => {
  console.log(props);
  return <BrowserView {...props} />;
};

/**
 * Generate static paths for all assemblies that have JBrowse configs.
 * @returns Promise with paths array.
 */
export const getStaticPaths: GetStaticPaths<PageUrl> = async () => {
  const appConfig = config();
  const { entities } = appConfig;

  // Find the assemblies entity config
  const entityConfig = getEntityConfig(entities, "assemblies");

  // Seed the database before fetching entities
  await seedDatabase("assemblies", entityConfig);

  // Fetch all assemblies
  const entitiesResponse: EntitiesResponse<
    BRCDataCatalogGenome | GA2AssemblyEntity
  > = await getEntities(entityConfig);

  // Build paths only for assemblies with JBrowse configs
  const paths = entitiesResponse.hits
    .filter((assembly) => assembly.jbrowseConfigUrl)
    .map((assembly) => {
      const entityId = entityConfig.getId?.(assembly);
      return {
        params: {
          entityId: entityId as string,
        },
      };
    });

  console.log(
    `[getStaticPaths....] Generating ${paths.length} browser pages:`,
    paths.map((p) => `/browser/${p.params.entityId}`)
  );

  return {
    fallback: false,
    paths,
  };
};

/**
 * Get static props for specific assembly browser page.
 * @param context - GetStaticPropsContext with params.
 * @param context.params - URL parameters containing entityId.
 * @returns Props for the page or notFound.
 */
export const getStaticProps: GetStaticProps<BrowserPageProps> = async ({
  params,
}: GetStaticPropsContext) => {
  if (!params || typeof params.entityId !== "string") {
    return { notFound: true };
  }
  console.log("PROPS");
  const { entityId } = params as PageUrl;
  const appConfig = config();
  const { entities } = appConfig;

  const entityConfig = getEntityConfig(entities, "assemblies");

  // Process assembly props (conditionally loads data based on staticLoad config)
  const assembly = await processAssemblyProps(entityConfig, entityId);

  // Return 404 if assembly not found or has no JBrowse config
  if (!assembly || !assembly.jbrowseConfigUrl) {
    return { notFound: true };
  }

  return {
    props: {
      assembly,
      entityId,
    },
  };
};

/**
 * Processes the assembly props for the browser page.
 * Only loads data if staticLoad is enabled in entity config.
 * @param entityConfig - Entity config for assemblies.
 * @param entityId - Assembly ID to fetch.
 * @returns The assembly data or null if not found or staticLoad is disabled.
 */
async function processAssemblyProps(
  entityConfig: EntityConfig,
  entityId: string
): Promise<BRCDataCatalogGenome | GA2AssemblyEntity | null> {
  const {
    detail: { staticLoad },
  } = entityConfig;
  // Early exit; return if the entity is not to be statically loaded.
  if (!staticLoad) return null;
  // Seed database.
  await seedDatabase(entityConfig.route, entityConfig);
  // Fetch entity detail from database.
  const assembly = await getEntity<BRCDataCatalogGenome>(
    entityConfig,
    entityId
  );
  return assembly;
}

// Set custom Main component styling
BrowserPage.Main = StyledBrowserMain;

export default BrowserPage;
