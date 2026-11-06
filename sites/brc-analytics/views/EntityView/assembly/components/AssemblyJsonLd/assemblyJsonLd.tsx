import { useConfig } from "@databiosphere/findable-ui/lib/hooks/useConfig";
import Head from "next/head";
import { type JSX } from "react";
import { type AssemblyJsonLdProps } from "./types";
import {
  buildAssemblyJsonLd,
  serializeJsonLd,
  shouldPublishDatasetRecords,
} from "./utils";

/**
 * An assembly's schema.org Dataset record, as JSON-LD in the page head, so
 * Google Dataset Search can list the assembly. The site's name and address
 * come from its config. Rendered in production builds only.
 * @param props - Component props.
 * @param props.assembly - Assembly.
 * @returns The JSON-LD script, or nothing outside production.
 */
export const AssemblyJsonLd = ({
  assembly,
}: AssemblyJsonLdProps): JSX.Element | null => {
  const {
    config: { appTitle, browserURL },
  } = useConfig();
  if (!shouldPublishDatasetRecords()) return null;
  return (
    <Head>
      <script
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd(
            buildAssemblyJsonLd(assembly, browserURL, appTitle)
          ),
        }}
        type="application/ld+json"
      />
    </Head>
  );
};
