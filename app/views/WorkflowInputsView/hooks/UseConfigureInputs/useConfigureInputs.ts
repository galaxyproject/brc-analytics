import { useCallback, useState } from "react";
import { ConfiguredInput, ConfiguredValue, UseConfigureInputs } from "./types";

export const useConfigureInputs = (): UseConfigureInputs => {
  const [configuredInput, setConfiguredInput] = useState<ConfiguredInput>({
    readRuns: {
      entryLabel: "Read Runs",
      values: [
        {
          key: "http://ftp.sra.ebi.ac.uk/vol1/fastq/ERR128/025/ERR12862725/ERR12862725.fastqsanger.gz,ftp.sra.ebi.ac.uk/vol1/fastq/SRR134/009/SRR13423209/SRR13423209_1.fastqsanger.gz",
          value:
            "http://ftp.sra.ebi.ac.uk/vol1/fastq/ERR128/025/ERR12862725/ERR12862725.fastqsanger.gz,ftp.sra.ebi.ac.uk/vol1/fastq/SRR134/009/SRR13423209/SRR13423209_1.fastqsanger.gz",
        },
      ],
    },
  });

  const onConfigure = useCallback(
    (entryKey: string, entryLabel: string, values: ConfiguredValue[]): void => {
      setConfiguredInput((prev) => ({
        ...prev,
        [entryKey]: { entryLabel, values },
      }));
    },
    []
  );

  return { configuredInput, onConfigure };
};
