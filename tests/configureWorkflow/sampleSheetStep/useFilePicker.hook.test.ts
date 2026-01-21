import { act, renderHook } from "@testing-library/react";
import { ChangeEvent } from "react";
import { VALIDATION_ERROR } from "../../../app/components/Entity/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/SampleSheetStep/hooks/UseFilePicker/constants";
import { useFilePicker } from "../../../app/components/Entity/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/SampleSheetStep/hooks/UseFilePicker/hook";
import { parseFile } from "../../../app/components/Entity/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/SampleSheetStep/hooks/UseFilePicker/utils";

jest.mock(
  "../../../app/components/Entity/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/SampleSheetStep/hooks/UseFilePicker/utils",
  () => ({
    ...jest.requireActual(
      "../../../app/components/Entity/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/SampleSheetStep/hooks/UseFilePicker/utils"
    ),
    parseFile: jest.fn(),
  })
);

const mockParseFile = parseFile as jest.MockedFunction<typeof parseFile>;

const actualUtils = jest.requireActual(
  "../../../app/components/Entity/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/SampleSheetStep/hooks/UseFilePicker/utils"
);

/**
 * Creates a mock ChangeEvent for file input.
 * @param file - The file to include in the event, or null for no file.
 * @returns The mock change event.
 */
function createMockFileChangeEvent(
  file: File | null
): ChangeEvent<HTMLInputElement> {
  return {
    target: {
      files: file ? [file] : [],
    },
  } as unknown as ChangeEvent<HTMLInputElement>;
}

/**
 * Creates a mock File object.
 * @param name - The file name.
 * @param size - The file size in bytes.
 * @returns The mock File object.
 */
function createMockFile(name: string, size = 1024): File {
  const content = new Array(size).fill("a").join("");
  return new File([content], name, { type: "text/csv" });
}

describe("useFilePicker", () => {
  beforeEach(() => {
    mockParseFile.mockImplementation(actualUtils.parseFile);
  });

  test("initializes with null file", () => {
    const { result } = renderHook(() => useFilePicker());

    expect(result.current.file).toBeNull();
  });

  test("initializes with inputRef", () => {
    const { result } = renderHook(() => useFilePicker());

    expect(result.current.inputRef).toBeDefined();
    expect(result.current.inputRef.current).toBeNull();
  });

  test("onFileChange sets file when file is selected", () => {
    const { result } = renderHook(() => useFilePicker());
    const mockFile = createMockFile("test.csv");
    const event = createMockFileChangeEvent(mockFile);

    act(() => {
      result.current.actions.onFileChange(event, {});
    });

    expect(result.current.file).toBe(mockFile);
  });

  test("onFileChange does not update file when no file is selected", () => {
    const { result } = renderHook(() => useFilePicker());
    const mockFile = createMockFile("test.csv");

    // First set a file
    act(() => {
      result.current.actions.onFileChange(
        createMockFileChangeEvent(mockFile),
        {}
      );
    });

    // Then trigger change with no file
    act(() => {
      result.current.actions.onFileChange(createMockFileChangeEvent(null), {});
    });

    // File should remain unchanged
    expect(result.current.file).toBe(mockFile);
  });

  test("onClear resets file to null", () => {
    const { result } = renderHook(() => useFilePicker());
    const mockFile = createMockFile("test.csv");

    // Set a file first
    act(() => {
      result.current.actions.onFileChange(
        createMockFileChangeEvent(mockFile),
        {}
      );
    });

    expect(result.current.file).toBe(mockFile);

    // Clear the file
    act(() => {
      result.current.actions.onClear();
    });

    expect(result.current.file).toBeNull();
  });

  test("onClear resets input value when inputRef is set", () => {
    const { result } = renderHook(() => useFilePicker());

    // Create a mock input element
    const mockInput = document.createElement("input");
    mockInput.value = "some-file.csv";

    // Manually set the ref
    Object.defineProperty(result.current.inputRef, "current", {
      value: mockInput,
      writable: true,
    });

    act(() => {
      result.current.actions.onClear();
    });

    expect(mockInput.value).toBe("");
  });

  test("onClick triggers click on input element", () => {
    const { result } = renderHook(() => useFilePicker());

    // Create a mock input element with a click spy
    const mockInput = document.createElement("input");
    const clickSpy = jest.spyOn(mockInput, "click");

    // Manually set the ref
    Object.defineProperty(result.current.inputRef, "current", {
      value: mockInput,
      writable: true,
    });

    act(() => {
      result.current.actions.onClick();
    });

    expect(clickSpy).toHaveBeenCalled();
  });

  test("onClick does not throw when inputRef is null", () => {
    const { result } = renderHook(() => useFilePicker());

    expect(() => {
      act(() => {
        result.current.actions.onClick();
      });
    }).not.toThrow();
  });

  test("onFileChange does not call onComplete when same file is re-selected", async () => {
    const { result } = renderHook(() => useFilePicker());
    // Create a valid CSV file with 4 columns and 2 data rows
    const validContent = "a,b,c,d\n1,2,3,4\n5,6,7,8";
    const mockFile = new File([validContent], "test.csv", { type: "text/csv" });
    const onComplete = jest.fn();

    await act(async () => {
      await result.current.actions.onFileChange(
        createMockFileChangeEvent(mockFile),
        { onComplete }
      );
    });

    // Re-select the same file (same name, size, lastModified)
    await act(async () => {
      await result.current.actions.onFileChange(
        createMockFileChangeEvent(mockFile),
        { onComplete }
      );
    });

    // onComplete should NOT be called again for the same file
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  test("initializes with empty validation errors", () => {
    const { result } = renderHook(() => useFilePicker());

    expect(result.current.validation.errors).toEqual([]);
    expect(result.current.validation.valid).toBe(false);
  });

  test("onClear resets validation errors", async () => {
    const { result } = renderHook(() => useFilePicker());
    // Create a file that will fail validation (less than 4 columns)
    const invalidContent = "a,b\n1,2\n3,4";
    const invalidFile = new File([invalidContent], "invalid.csv", {
      type: "text/csv",
    });

    await act(async () => {
      await result.current.actions.onFileChange(
        createMockFileChangeEvent(invalidFile),
        {}
      );
    });

    expect(result.current.validation.errors.length).toBeGreaterThan(0);

    act(() => {
      result.current.actions.onClear();
    });

    expect(result.current.validation.errors).toEqual([]);
  });

  test("onFileChange sets parse error when parsing fails", async () => {
    const { result } = renderHook(() => useFilePicker());
    const mockFile = createMockFile("test.csv");

    mockParseFile.mockRejectedValueOnce(new Error("Parse error"));

    await act(async () => {
      await result.current.actions.onFileChange(
        createMockFileChangeEvent(mockFile),
        {}
      );
    });

    expect(result.current.validation.errors).toEqual([
      VALIDATION_ERROR.PARSE_FAILED,
    ]);
  });
});
