import { AnalyzeEntity } from "../AnalyzeEntity/analyzeEntity";
import { AnalyzeGenomeProps } from "./types";

export const AnalyzeGenome = ({
  analyze,
  views,
}: AnalyzeGenomeProps): JSX.Element => {
  return <AnalyzeEntity analyze={analyze} views={views} />;
};
