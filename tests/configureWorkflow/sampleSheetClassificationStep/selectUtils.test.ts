import { isOptionDisabled } from "../../../app/components/Entity/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/SampleSheetClassificationStep/components/ClassificationTable/components/Select/utils";
import {
  COLUMN_TYPE,
  ColumnClassifications,
} from "../../../app/components/Entity/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/SampleSheetClassificationStep/types";

describe("isOptionDisabled", () => {
  describe("single-select types", () => {
    test("disables IDENTIFIER when already used by another column", () => {
      const classifications: ColumnClassifications = {
        col1: COLUMN_TYPE.IDENTIFIER,
        col2: null,
      };

      const result = isOptionDisabled(
        COLUMN_TYPE.IDENTIFIER,
        null,
        classifications
      );

      expect(result).toBe(true);
    });

    test("disables FORWARD_FILE_PATH when already used by another column", () => {
      const classifications: ColumnClassifications = {
        col1: COLUMN_TYPE.FORWARD_FILE_PATH,
        col2: null,
      };

      const result = isOptionDisabled(
        COLUMN_TYPE.FORWARD_FILE_PATH,
        null,
        classifications
      );

      expect(result).toBe(true);
    });

    test("disables REVERSE_FILE_PATH when already used by another column", () => {
      const classifications: ColumnClassifications = {
        col1: COLUMN_TYPE.REVERSE_FILE_PATH,
        col2: null,
      };

      const result = isOptionDisabled(
        COLUMN_TYPE.REVERSE_FILE_PATH,
        null,
        classifications
      );

      expect(result).toBe(true);
    });

    test("does not disable single-select type for the column that owns it", () => {
      const classifications: ColumnClassifications = {
        col1: COLUMN_TYPE.IDENTIFIER,
        col2: null,
      };

      const result = isOptionDisabled(
        COLUMN_TYPE.IDENTIFIER,
        COLUMN_TYPE.IDENTIFIER,
        classifications
      );

      expect(result).toBe(false);
    });

    test("does not disable unused single-select types", () => {
      const classifications: ColumnClassifications = {
        col1: COLUMN_TYPE.BIOLOGICAL_FACTOR,
        col2: null,
      };

      expect(
        isOptionDisabled(COLUMN_TYPE.IDENTIFIER, null, classifications)
      ).toBe(false);
      expect(
        isOptionDisabled(COLUMN_TYPE.FORWARD_FILE_PATH, null, classifications)
      ).toBe(false);
      expect(
        isOptionDisabled(COLUMN_TYPE.REVERSE_FILE_PATH, null, classifications)
      ).toBe(false);
    });
  });

  describe("multi-select types", () => {
    test("does not disable BIOLOGICAL_FACTOR even when already used", () => {
      const classifications: ColumnClassifications = {
        col1: COLUMN_TYPE.BIOLOGICAL_FACTOR,
        col2: null,
      };

      const result = isOptionDisabled(
        COLUMN_TYPE.BIOLOGICAL_FACTOR,
        null,
        classifications
      );

      expect(result).toBe(false);
    });

    test("does not disable TECHNICAL_BLOCKING even when already used", () => {
      const classifications: ColumnClassifications = {
        col1: COLUMN_TYPE.TECHNICAL_BLOCKING_FACTOR,
        col2: null,
      };

      const result = isOptionDisabled(
        COLUMN_TYPE.TECHNICAL_BLOCKING_FACTOR,
        null,
        classifications
      );

      expect(result).toBe(false);
    });

    test("does not disable OTHER_COVARIATE even when already used", () => {
      const classifications: ColumnClassifications = {
        col1: COLUMN_TYPE.OTHER_COVARIATE,
        col2: null,
      };

      const result = isOptionDisabled(
        COLUMN_TYPE.OTHER_COVARIATE,
        null,
        classifications
      );

      expect(result).toBe(false);
    });

    test("does not disable QC_ONLY even when already used", () => {
      const classifications: ColumnClassifications = {
        col1: COLUMN_TYPE.QC_ONLY,
        col2: null,
      };

      const result = isOptionDisabled(
        COLUMN_TYPE.QC_ONLY,
        null,
        classifications
      );

      expect(result).toBe(false);
    });

    test("does not disable IGNORED even when already used", () => {
      const classifications: ColumnClassifications = {
        col1: COLUMN_TYPE.IGNORED,
        col2: null,
      };

      const result = isOptionDisabled(
        COLUMN_TYPE.IGNORED,
        null,
        classifications
      );

      expect(result).toBe(false);
    });
  });

  describe("edge cases", () => {
    test("does not disable any option when classifications are empty", () => {
      const classifications: ColumnClassifications = {};

      expect(
        isOptionDisabled(COLUMN_TYPE.IDENTIFIER, null, classifications)
      ).toBe(false);
      expect(
        isOptionDisabled(COLUMN_TYPE.FORWARD_FILE_PATH, null, classifications)
      ).toBe(false);
      expect(
        isOptionDisabled(COLUMN_TYPE.REVERSE_FILE_PATH, null, classifications)
      ).toBe(false);
      expect(
        isOptionDisabled(COLUMN_TYPE.BIOLOGICAL_FACTOR, null, classifications)
      ).toBe(false);
    });

    test("does not disable any option when all classifications are null", () => {
      const classifications: ColumnClassifications = {
        col1: null,
        col2: null,
        col3: null,
      };

      expect(
        isOptionDisabled(COLUMN_TYPE.IDENTIFIER, null, classifications)
      ).toBe(false);
      expect(
        isOptionDisabled(COLUMN_TYPE.FORWARD_FILE_PATH, null, classifications)
      ).toBe(false);
    });

    test("handles all single-select types being used", () => {
      const classifications: ColumnClassifications = {
        col1: COLUMN_TYPE.IDENTIFIER,
        col2: COLUMN_TYPE.FORWARD_FILE_PATH,
        col3: COLUMN_TYPE.REVERSE_FILE_PATH,
        col4: null,
      };

      expect(
        isOptionDisabled(COLUMN_TYPE.IDENTIFIER, null, classifications)
      ).toBe(true);
      expect(
        isOptionDisabled(COLUMN_TYPE.FORWARD_FILE_PATH, null, classifications)
      ).toBe(true);
      expect(
        isOptionDisabled(COLUMN_TYPE.REVERSE_FILE_PATH, null, classifications)
      ).toBe(true);

      expect(
        isOptionDisabled(COLUMN_TYPE.BIOLOGICAL_FACTOR, null, classifications)
      ).toBe(false);
      expect(isOptionDisabled(COLUMN_TYPE.IGNORED, null, classifications)).toBe(
        false
      );
    });

    test("allows changing from one single-select type to another", () => {
      const classifications: ColumnClassifications = {
        col1: COLUMN_TYPE.IDENTIFIER,
        col2: null,
      };

      const result = isOptionDisabled(
        COLUMN_TYPE.FORWARD_FILE_PATH,
        COLUMN_TYPE.IDENTIFIER,
        classifications
      );

      expect(result).toBe(false);
    });
  });
});
