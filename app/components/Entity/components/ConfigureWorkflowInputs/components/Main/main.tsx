import { Props } from "./types";
import { Stepper } from "./components/Stepper/stepper";

export const Main = ({ genome, workflow }: Props): JSX.Element => {
  return <Stepper genome={genome} workflow={workflow} />;
};
