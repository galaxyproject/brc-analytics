import { ftpToAscp } from "../../../app/utils/galaxy-api/url-utils";

const TEST_DATA = {
  ASCP_URL:
    "ascp://fasp.sra.ebi.ac.uk/vol1/fastq/SRR292/094/SRR29244694/SRR29244694_1.fastq.gz",
};

const EXPECTED = {
  ASCP_URL: TEST_DATA.ASCP_URL,
} as const;

/**
 * Tests for FTP to ASCP URL conversion logic.
 * These tests verify the URL normalization behavior for ENA file URLs.
 */

describe("ftpToAscp URL conversion", () => {
  describe("ENA FTP URL formats", () => {
    it("converts ftp:// prefixed URL to ascp://", () => {
      const input =
        "ftp://ftp.sra.ebi.ac.uk/vol1/fastq/SRR292/094/SRR29244694/SRR29244694_1.fastq.gz";

      expect(ftpToAscp(input)).toBe(EXPECTED.ASCP_URL);
    });

    it("converts bare ftp.sra host to ascp:// with fasp.sra host", () => {
      const input =
        "ftp.sra.ebi.ac.uk/vol1/fastq/SRR292/094/SRR29244694/SRR29244694_1.fastq.gz";

      expect(ftpToAscp(input)).toBe(EXPECTED.ASCP_URL);
    });
  });

  describe("ENA ASCP URL formats", () => {
    it("returns properly formatted ascp:// URL unchanged", () => {
      const input = TEST_DATA.ASCP_URL;

      expect(ftpToAscp(input)).toBe(input);
    });

    it("converts bare fasp.sra host to ascp:// prefixed URL", () => {
      const input =
        "fasp.sra.ebi.ac.uk/vol1/fastq/SRR292/094/SRR29244694/SRR29244694_1.fastq.gz";

      expect(ftpToAscp(input)).toBe(EXPECTED.ASCP_URL);
    });

    it("normalizes ascp:// URL with ftp.sra host to fasp.sra host", () => {
      const input =
        "ascp://ftp.sra.ebi.ac.uk/vol1/fastq/SRR292/094/SRR29244694/SRR29244694_1.fastq.gz";

      expect(ftpToAscp(input)).toBe(EXPECTED.ASCP_URL);
    });
  });

  describe("non-ENA URLs", () => {
    it("returns HTTPS URLs unchanged", () => {
      const input = "https://example.com/data/file.fastq.gz";

      expect(ftpToAscp(input)).toBe(input);
    });

    it("returns HTTP URLs unchanged", () => {
      const input = "http://example.com/data/file.fastq.gz";

      expect(ftpToAscp(input)).toBe(input);
    });

    it("returns S3 URLs unchanged", () => {
      const input = "s3://bucket-name/path/to/file.fastq.gz";

      expect(ftpToAscp(input)).toBe(input);
    });

    it("returns non-ENA FTP URLs unchanged", () => {
      const input = "ftp://ftp.example.com/data/file.fastq.gz";

      expect(ftpToAscp(input)).toBe(input);
    });
  });

  describe("edge cases", () => {
    it("handles URLs with query parameters", () => {
      const input = "ftp://ftp.sra.ebi.ac.uk/vol1/file.fastq.gz?param=value";
      const expected =
        "ascp://fasp.sra.ebi.ac.uk/vol1/file.fastq.gz?param=value";

      expect(ftpToAscp(input)).toBe(expected);
    });

    it("handles URLs with fragments", () => {
      const input = "ftp://ftp.sra.ebi.ac.uk/vol1/file.fastq.gz#section";
      const expected = "ascp://fasp.sra.ebi.ac.uk/vol1/file.fastq.gz#section";

      expect(ftpToAscp(input)).toBe(expected);
    });

    it("handles paths with special characters", () => {
      const input =
        "ftp://ftp.sra.ebi.ac.uk/vol1/path%20with%20spaces/file.fastq.gz";
      const expected =
        "ascp://fasp.sra.ebi.ac.uk/vol1/path%20with%20spaces/file.fastq.gz";

      expect(ftpToAscp(input)).toBe(expected);
    });
  });
});
