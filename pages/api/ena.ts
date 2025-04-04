import type { NextApiRequest, NextApiResponse } from "next";

export const ACCESSION_TYPE_FIELD_MAP: Record<string, string> = {
  experiment: "experiment_accession",
  run: "run_accession",
  sample: "sample_accession",
  study: "study_accession",
};

export const ENA_FIELDS = [
  "run_accession",
  "fastq_ftp",
  "fastq_aspera",
  "experiment_accession",
  "study_accession",
  "library_layout",
  "instrument_model",
];

const FIELDS = ENA_FIELDS.join(",");

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<void> {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { accessionType, accessionId } = req.query;

  if (!accessionType || !accessionId) {
    return res
      .status(404)
      .json({ error: "Missing accession type or accession ID" });
  }

  const enaField = ACCESSION_TYPE_FIELD_MAP[accessionType as string];

  if (!enaField) {
    return res.status(400).json({ error: "Invalid accessionType" });
  }

  const proxy =
    process.env.NODE_ENV === "development"
      ? "http://localhost:3000"
      : "https://brc-analytics.com";

  const url = `https://brc-analytics.dev.clevercanary.com/ena/portal/api/search?result=read_run&query=${enaField}=${accessionId}&fields=${FIELDS}&format=json`;

  try {
    const response = await fetch(url);
    const json = await response.json();
    return res.status(200).json(json);
  } catch (e) {
    return res.status(500).json({ error: "Failed to fetch from ENA" });
  }
}
