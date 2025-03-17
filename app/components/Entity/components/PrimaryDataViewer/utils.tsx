/**
 * Combines parts of an expression into a single string.
 *
 * This function takes an array of string arrays, where each inner array represents
 * a part of an expression. It joins the elements of each inner array with an "=" sign,
 * then joins all the parts with a space, and finally replaces any multiple spaces with a single space.
 *
 * @param parts - An array of string arrays representing parts of an expression.
 * @returns The combined expression as a single string.
 */
export function combineExpressionParts(parts: string[][]): string {
  return parts
    .map((part: string[]) => part.join("="))
    .join(" ")
    .replace(/\s+/g, " ");
}

export function formatExpression(expression: string): string {
  // Make sure that any form of ' And ' and ' Or ' will be convert to
  // ' AND ' and ' OR ' respectively
  // Also remove whitespace adjecent to = sign
  return expression
    .replace(/\s[Aa][Nn][Dd]\s/g, " AND ")
    .replace(/\s[Oo][Rr]\s/g, " OR ")
    .replace(/\b\s*=\s*\b/g, "=");
}

/**
 * Formats a large number into a more readable string with appropriate suffixes.
 *
 * - Numbers greater than or equal to 1 billion are formatted with a 'G' suffix.
 * - Numbers greater than or equal to 1 million are formatted with an 'M' suffix.
 * - Numbers greater than or equal to 1 thousand are formatted with a 'K' suffix.
 * - Numbers less than 1 thousand are returned as-is.
 *
 * @param value - The number to format.
 * @returns The formatted number as a string with the appropriate suffix.
 */
export function formatLargeNumber(value: number): string {
  if (value >= 1e9) return `${(value / 1e9).toFixed(1)}G`;
  if (value >= 1e6) return `${(value / 1e6).toFixed(1)}M`;
  if (value >= 1e3) return `${(value / 1e3).toFixed(1)}K`;
  return value.toString();
}

/**
 * Splits a given string by spaces, parentheses, and quotes, while preserving quoted substrings.
 *
 * This function takes a string and splits it into an array of substrings based on spaces,
 * parentheses, and quotes. Quoted substrings (either single or double quotes) are preserved
 * as single elements in the resulting array.
 *
 * @param s - The input string to be split.
 * @returns An array of substrings, with quoted substrings preserved.
 *
 * @example
 * ```typescript
 * validateExpression('(tax_id=7165 AND library_layout=SINGLE) OR (scientific_name="Taeniopygia guttata" AND instrument_platform=ILLUMINA) OR accession=GCA_023851605.1')
 * // returns ["(", "tax_id=7165", "AND", "library_layout=SINGLE", ")", "OR", "(", 'scientific_name="Taeniopygia guttata"', "AND", "instrument_platform=ILLUMINA", ")", "OR", "accession=GCA_023851605.1"]
 * ```
 */
export function splitUnqouatedSpace(s: string): string[] {
  if (/\s/.test(s)) {
    let part;
    let qouteChar = "";
    const parts = s.split(/(\(|\)|\s+)/).filter((part) => part.trim() !== "");
    const combinedParts = [];
    while ((part = parts.shift()) !== undefined) {
      const firstQuoteIndex = part.search(/['"]/);
      if (firstQuoteIndex === -1) {
        // No quotes in the part
        combinedParts.push(part);
      } else {
        // Quotes in the part, lets find the closing quote
        qouteChar = part[firstQuoteIndex];
        while (!part.endsWith(qouteChar) && parts.length > 0) {
          part += ` ${parts.shift()}`;
        }
        combinedParts.push(part);
      }
    }
    if (part) {
      combinedParts.push(part);
    }
    return combinedParts;
  }
  return [s];
}

/**
 * Validates an expression to ensure it follows the expected format.
 *
 * This function checks for balanced parentheses, valid conditions, and proper use of logical operators.
 * It returns an array of error messages if any issues are found in the expression.
 *
 * @param expression - The expression to validate.
 * @returns An array of error messages, or an empty array if the expression is valid.
 *
 * @example
 * ```typescript
 * validateExpression('(tax_id=7165 AND library_layout=SINGLE) OR (scientific_name="Taeniopygia guttata" AND instrument_platform=ILLUMINA) OR accession=GCA_023851605.1')
 * // returns []
 * ```
 */
export function validateExpression(expression: string): string[] {
  const expression_bullder = /(\(|\)|\bAND\b|\bOR\b)/;

  const proceessParts = (parts: string[]): string[] => {
    // Regular expressions for validation
    // Ensure that non-operator parts follow the pattern:
    // <lowercase character, underscore> = <any character, any number, underscore, dash, and dots>
    const conditionPattern = /^\s*([a-z_]+)\s*!?=\s*([A-Za-z0-9._-]+)\s*$/;
    // <lowercase character, underscore> = <wrapped with quotations characters, any character, any number, underscore, dash, dots, and space>
    const conditionPatternWithSpace =
      /^\s*([a-z_]+)\s*!?=\s*(["'][A-Za-z0-9._ -]+["'])\s*$/;
    // Logical operators, which need to be in uppercase and have adjacent spaces
    const operatorPattern = /^\s*(AND|OR)\s*$/;
    let prevWasCondition = false;
    const expression_status = [];
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (conditionPattern.test(part) || conditionPatternWithSpace.test(part)) {
        if (prevWasCondition) {
          expression_status.push(`Error: Missing operator before '${part}'.`);
        }
        prevWasCondition = true;
      } else if (operatorPattern.test(part)) {
        if (!prevWasCondition) {
          expression_status.push(
            `Error: Operator '${part}' must be between conditions.`
          );
        }
        prevWasCondition = false;
      } else {
        expression_status.push(`Error: Invalid expression '${part}'.`);
      }
    }

    if (!prevWasCondition) {
      expression_status.push(
        "Error: Expression must end with a valid condition."
      );
    }

    return expression_status;
  };

  const expression_status = [];
  if (expression !== "") {
    // Check for parentheses without content
    const emptyParentheses = /\(\s*\)/;

    // Check for unbalanced parentheses
    if (
      expression.match(/(\()/g)?.length !== expression.match(/(\))/g)?.length
    ) {
      expression_status.push("Error: Unbalanced parentheses.");
    }

    if (emptyParentheses.test(expression)) {
      expression_status.push("Error: Parentheses without content.");
    }

    // Process parts of the expression
    const parts = proceessParts(
      expression
        .replace(/[()]/g, "")
        .split(expression_bullder)
        .map((t) => t.trim())
        .filter((t) => t.length > 0)
    );
    expression_status.push(...parts);
  }

  return expression_status;
}
