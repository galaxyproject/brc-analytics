import {
  getChecksumForPath,
  fetchUcscMd5Checksums,
} from "../app/utils/ucsc-tracks-api/ucsc-tracks-api";

// Mock fetch for testing
global.fetch = jest.fn();

describe("UCSC Tracks API - Checksum Functions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "warn").mockImplementation(() => {});
    jest.spyOn(console, "info").mockImplementation(() => {});
  });

  // We'll focus on testing the public functions and their behavior

  describe("fetchUcscMd5Checksums", () => {
    it("should fetch and parse checksums successfully", async () => {
      // First mock response for files API to find md5sum.txt
      const filesApiResponse = {
        json: jest.fn().mockResolvedValue({
          urlList: [
            { url: "hubs/GCF/045/689/255/GCF_045689255.1/md5sum.txt" },
            { url: "hubs/GCF/045/689/255/GCF_045689255.1/trackDb.txt" },
          ],
        }),
        ok: true,
      };

      // Second mock response for fetching the md5sum.txt content
      const md5FileResponse = {
        ok: true,
        text: jest
          .fn()
          .mockResolvedValue(
            "84adf5fc228278369f6cc70e9d6080fe  /mirrordata/hubs/GCF/045/689/255/GCF_045689255.1/GCF_045689255.1.fa.gz\n" +
              "17e7045f3fef618285479c5a0ce99bd8  /mirrordata/hubs/GCF/045/689/255/GCF_045689255.1/trackDb.txt"
          ),
      };

      // Set up fetch to return different responses for different URLs
      (global.fetch as jest.Mock).mockImplementation((url: string) => {
        if (url.includes("list/files")) {
          return Promise.resolve(filesApiResponse);
        } else if (url.includes("md5sum.txt")) {
          return Promise.resolve(md5FileResponse);
        }
        return Promise.reject(new Error("Unexpected URL"));
      });

      const result = await fetchUcscMd5Checksums("GCF_045689255.1");

      expect(result.size).toBe(2);
      expect(
        result.get(
          "/mirrordata/hubs/GCF/045/689/255/GCF_045689255.1/GCF_045689255.1.fa.gz"
        )
      ).toBe("84adf5fc228278369f6cc70e9d6080fe");
      expect(console.info).toHaveBeenCalledWith(
        expect.stringContaining("Successfully loaded 2 MD5 checksums")
      );
    });

    it("should return empty map when md5sum.txt URL is not found", async () => {
      // Mock files API response without md5sum.txt
      const filesApiResponse = {
        json: jest.fn().mockResolvedValue({
          urlList: [
            { url: "hubs/GCF/045/689/255/GCF_045689255.1/trackDb.txt" },
          ],
        }),
        ok: true,
      };

      (global.fetch as jest.Mock).mockResolvedValue(filesApiResponse);

      const result = await fetchUcscMd5Checksums("GCF_045689255.1");

      expect(result.size).toBe(0);
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining("Could not find md5sum.txt")
      );
    });

    it("should handle fetch errors gracefully", async () => {
      // Mock fetch to throw an error
      (global.fetch as jest.Mock).mockRejectedValue(new Error("Network error"));

      const result = await fetchUcscMd5Checksums("GCF_045689255.1");

      expect(result.size).toBe(0);
      // The actual error message is different than what we expected
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining("Error querying files API")
      );
    });
  });

  describe("getChecksumForPath", () => {
    it("should return undefined when checksums map is empty", () => {
      const result = getChecksumForPath(
        "https://hgdownload.soe.ucsc.edu/hubs/GCF/045/689/255/GCF_045689255.1/GCF_045689255.1.fa.gz",
        "GCF_045689255.1",
        new Map()
      );

      expect(result).toBeUndefined();
    });

    it("should find checksum for a direct path match", () => {
      const checksums = new Map([
        ["GCF_045689255.1.fa.gz", "84adf5fc228278369f6cc70e9d6080fe"],
      ]);

      const result = getChecksumForPath(
        "https://hgdownload.soe.ucsc.edu/hubs/GCF/045/689/255/GCF_045689255.1/GCF_045689255.1.fa.gz",
        "GCF_045689255.1",
        checksums
      );

      expect(result).toBe("84adf5fc228278369f6cc70e9d6080fe");
    });

    it("should find checksum for a path with ./ prefix", () => {
      const checksums = new Map([
        ["./GCF_045689255.1.fa.gz", "84adf5fc228278369f6cc70e9d6080fe"],
      ]);

      const result = getChecksumForPath(
        "https://hgdownload.soe.ucsc.edu/hubs/GCF/045/689/255/GCF_045689255.1/GCF_045689255.1.fa.gz",
        "GCF_045689255.1",
        checksums
      );

      expect(result).toBe("84adf5fc228278369f6cc70e9d6080fe");
    });

    it("should find checksum by matching filename when full path doesn't match", () => {
      // This tests the case where the md5sum.txt contains full paths like:
      // "84adf5fc228278369f6cc70e9d6080fe  /mirrordata/hubs/GCF/045/689/255/GCF_045689255.1/GCF_045689255.1.fa.gz"
      const checksums = new Map([
        [
          "/mirrordata/hubs/GCF/045/689/255/GCF_045689255.1/GCF_045689255.1.fa.gz",
          "84adf5fc228278369f6cc70e9d6080fe",
        ],
      ]);

      const result = getChecksumForPath(
        "https://hgdownload.soe.ucsc.edu/hubs/GCF/045/689/255/GCF_045689255.1/GCF_045689255.1.fa.gz",
        "GCF_045689255.1",
        checksums
      );

      expect(result).toBe("84adf5fc228278369f6cc70e9d6080fe");
    });

    it("should find checksum by matching filename when path has no directory structure", () => {
      // This tests the case where the md5sum.txt contains simple entries like:
      // "0acca9c7b13d7231adac67a4c6e544b3  GCF_900681995.1.fa.gz"
      const checksums = new Map([
        ["GCF_900681995.1.fa.gz", "0acca9c7b13d7231adac67a4c6e544b3"],
      ]);

      const result = getChecksumForPath(
        "https://hgdownload.soe.ucsc.edu/hubs/GCF/900/681/995/GCF_900681995.1/GCF_900681995.1.fa.gz",
        "GCF_900681995.1",
        checksums
      );

      expect(result).toBe("0acca9c7b13d7231adac67a4c6e544b3");
    });

    it("should return undefined when assembly ID is not in URL and filename doesn't match", () => {
      const checksums = new Map([
        ["GCF_045689255.1.fa.gz", "84adf5fc228278369f6cc70e9d6080fe"],
      ]);

      const result = getChecksumForPath(
        "https://hgdownload.soe.ucsc.edu/hubs/some/other/path/file.fa.gz",
        "GCF_045689255.1",
        checksums
      );

      expect(result).toBeUndefined();
    });

    it("should handle complex paths correctly", () => {
      const checksums = new Map([
        ["tracks/genes/refGene.bb", "abcdef1234567890"],
      ]);

      const result = getChecksumForPath(
        "https://hgdownload.soe.ucsc.edu/hubs/GCF/045/689/255/GCF_045689255.1/tracks/genes/refGene.bb",
        "GCF_045689255.1",
        checksums
      );

      expect(result).toBe("abcdef1234567890");
    });

    it("should find checksum by filename for nested paths", () => {
      const checksums = new Map([
        [
          "ixIxx/GCF_900681995.1_PVVCY_v1.ncbiRefSeq.ixx",
          "03a185d82fc672063b4c6a1fa18a6713",
        ],
      ]);

      const result = getChecksumForPath(
        "https://hgdownload.soe.ucsc.edu/hubs/GCF/900/681/995/GCF_900681995.1/ixIxx/GCF_900681995.1_PVVCY_v1.ncbiRefSeq.ixx",
        "GCF_900681995.1",
        checksums
      );

      expect(result).toBe("03a185d82fc672063b4c6a1fa18a6713");
    });
  });

  // We'll skip testing getHashesForUrl since it's in a different module
});
