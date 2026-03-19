import { QueryFunctionContext } from "@tanstack/react-query";
import ky from "ky";
import { ENA_FIELDS } from "../../hooks/UseENADataByAccession/constants";
import { QueryKey } from "../types";

/**
 * Fetches ENA sequencing data based on the provided taxonomy ID using React Query.
 *
 * @returns Data from the ENA endpoint.
 */
export function queryFn<T = unknown>(): (
  context: QueryFunctionContext<QueryKey>
) => Promise<T> {
  return ({ queryKey, signal }: QueryFunctionContext<QueryKey>) => {
    // The second element of the queryKey is the taxonomy ID.
    const { 1: taxonomyId } = queryKey;

    return ky(
      `${process.env.NEXT_PUBLIC_ENA_PROXY_DOMAIN}/ena/portal/api/search`,
      {
        searchParams: {
          fields: ENA_FIELDS.join(","),
          format: "json",
          query: `tax_tree(${taxonomyId})`,
          result: "read_run",
        },
        signal,
      }
    ).json<T>();
  };
}
