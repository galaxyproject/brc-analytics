const FTP_HOST = "ftp.sra.ebi.ac.uk";
const ASCP_HOST = "fasp.sra.ebi.ac.uk";

/**
 * Builds the address of an assembly's gzipped FASTA in the UCSC Genome Browser's
 * downloads, e.g. ".../hubs/GCF/000/002/765/GCF_000002765.6/GCF_000002765.6.fa.gz".
 * @param identifier - Assembly accession.
 * @returns The FASTA's address.
 */
export function buildFastaUrl(identifier: string): string {
  const baseUrl = "https://hgdownload.soe.ucsc.edu/hubs/";
  const parts = identifier.split("_");
  const formattedPath = `${parts[0]}/${parts[1].slice(0, 3)}/${parts[1].slice(
    3,
    6
  )}/${parts[1].slice(6, 9)}/${identifier}/${identifier}.fa.gz`;
  return `${baseUrl}${formattedPath}`;
}

/**
 * Converts FTP URLs to ASCP URLs for more reliable downloads.
 * Handles various input formats:
 * - ftp.sra.ebi.ac.uk/... -> ascp://fasp.sra.ebi.ac.uk/...
 * - ftp://ftp.sra.ebi.ac.uk/... -> ascp://fasp.sra.ebi.ac.uk/...
 * - fasp.sra.ebi.ac.uk/... -> ascp://fasp.sra.ebi.ac.uk/...
 * - ascp://fasp.sra.ebi.ac.uk/... -> ascp://fasp.sra.ebi.ac.uk/...
 * @param url - Input URL in any supported format
 * @returns Normalized ASCP URL or original URL if not an ENA FTP/ASCP URL
 */
export function ftpToAscp(url: string): string {
  // If already properly formatted ASCP URL, return as-is
  if (url.startsWith("ascp://") && url.includes(ASCP_HOST)) {
    return url;
  }

  // Check if this is an ENA FTP or ASCP URL
  const isFtpUrl = url.includes(FTP_HOST);
  const isAscpUrl = url.includes(ASCP_HOST);

  if (!isFtpUrl && !isAscpUrl) {
    // Not an ENA URL, return unchanged
    return url;
  }

  // Remove any existing protocol
  let cleanUrl = url.replace(/^(ftp|ascp):\/\//, "");

  // Replace FTP host with ASCP host
  cleanUrl = cleanUrl.replace(FTP_HOST, ASCP_HOST);

  // Ensure it starts with ascp://
  return `ascp://${cleanUrl}`;
}
