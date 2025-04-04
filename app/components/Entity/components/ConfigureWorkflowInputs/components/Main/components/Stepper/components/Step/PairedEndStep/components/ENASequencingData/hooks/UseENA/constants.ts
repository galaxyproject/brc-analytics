export const ENA_ACCESSION_REGEX_PATTERN: Record<string, RegExp> = {
  experiment: /^(?:(E|D|S)RX[0-9]{6,})$/i,
  run: /^(?:(E|D|S)RR[0-9]{6,})$/i,
  sample: /^(?:SAM(?:E|D|N)[A-Z]?[0-9]+|(?:E|D|S)RS[0-9]{6,})$/i,
  study: /^(?:PRJ(?:E|D|N)[A-Z][0-9]+|(?:E|D|S)RP[0-9]{6,})$/i,
};
