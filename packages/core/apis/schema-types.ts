/**
 * Site-neutral re-exports of shared catalog schema enums.
 *
 * These enums originate from the shared LinkML-generated schema and are
 * consumed by both the BRC and GA2 catalogs. Re-exporting them here gives each
 * site a site-neutral import path so that neither catalog has to import from
 * the other's directory.
 */
export { OrganismPloidy as ORGANISM_PLOIDY } from "catalog/schema/generated/schema";
