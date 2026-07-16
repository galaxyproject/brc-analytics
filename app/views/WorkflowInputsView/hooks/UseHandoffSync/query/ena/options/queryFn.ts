import { fetchENAData } from "@/components/Entity/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/SequencingStep/components/ENASequencingData/hooks/UseENADataByAccession/request";
import { BaseReadRun } from "@/components/Entity/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/SequencingStep/components/ENASequencingData/types";
import { AccessionInfo } from "@brc-analytics/core/components/Entity/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/SequencingStep/components/ENASequencingData/hooks/UseENADataByAccession/types";
import { getAccessionType } from "@brc-analytics/core/components/Entity/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/SequencingStep/components/ENASequencingData/hooks/UseENADataByAccession/utils";
import { QueryFunctionContext } from "@tanstack/react-query";
import { QueryKey } from "../types";

/**
 * Fetch ENA read-run data for handoff accessions. Reuses `fetchENAData` so
 * the handoff and manual-entry paths share one network code path. Accessions
 * that don't match a known ENA pattern are silently dropped.
 * @returns React Query queryFn that fetches ENA read-run data.
 */
export function queryFn(): (
  context: QueryFunctionContext<QueryKey>
) => Promise<BaseReadRun[]> {
  return async ({ queryKey }) => {
    const accessionStr = queryKey[1];
    if (!accessionStr) return [];

    const accessions = accessionStr.split(",").filter(Boolean);

    const accessionsInfo: AccessionInfo[] = [];

    for (const accession of accessions) {
      const accessionType = getAccessionType(accession);
      if (accessionType) accessionsInfo.push({ accession, accessionType });
    }

    if (accessionsInfo.length === 0) return [];

    const data = await fetchENAData<BaseReadRun>({
      accessionsInfo,
      submitOptions: { onError: () => undefined },
    });
    return data ?? [];
  };
}
