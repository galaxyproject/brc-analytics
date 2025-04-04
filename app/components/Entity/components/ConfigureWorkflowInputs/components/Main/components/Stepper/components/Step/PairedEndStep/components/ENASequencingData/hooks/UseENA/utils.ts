import { replaceParameters } from "@databiosphere/findable-ui/lib/utils/replaceParameters";
import { ENA_ACCESSION_REGEX_PATTERN } from "./constants";
import { SubmitOptions } from "./types";

const ENA_API =
  "/api/ena?accessionType={accessionType}&accessionId={accession}";

/**
 * Fetch ENA data for a given accession number.
 * @param accession - ENA accession number.
 * @returns Promise with the ENA data.
 */
export async function fetchENAData({
  accession,
  accessionType,
  submitOptions,
}: {
  accession: string;
  accessionType: string;
  submitOptions: SubmitOptions;
}): Promise<any> {
  // const res = await fetch(
  //   "https://brc-analytics.dev.clevercanary.com/ena/portal/api/search?result=read_run&query=experiment_accession=SRX022533&fields=run_accession,fastq_ftp,fastq_aspera,experiment_accession,study_accession,library_layout,instrument_model&format=json"
  // );

  const res = await fetch(
    replaceParameters(ENA_API, { accession, accessionType })
  );

  const data = await res.json();

  if (!data || !data.length) {
    submitOptions.onError?.();
    return;
  }

  submitOptions.onSuccess?.();

  return data;
}

/**
 * Determine the appropriate accession type based on the accession ID format.
 * Types are experiment, run, sample, and study.
 * @param accession - ENA accession number.
 * @returns Accession type.
 */
export function getAccessionType(accession: string): string | null {
  for (const [type, pattern] of Object.entries(ENA_ACCESSION_REGEX_PATTERN)) {
    if (pattern.test(accession)) {
      return type;
    }
  }
  return null;
}
