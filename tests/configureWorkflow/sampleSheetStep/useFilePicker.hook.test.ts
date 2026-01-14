import { act, renderHook } from "@testing-library/react";
import { ChangeEvent } from "react";
import { useFilePicker } from "../../../app/components/Entity/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/SampleSheetStep/hooks/UseFilePicker/hook";

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

  test("onFileChange calls onSuccess when first file is selected", () => {
    const { result } = renderHook(() => useFilePicker());
    const mockFile = createMockFile("test.csv");
    const onSuccess = jest.fn();

    act(() => {
      result.current.actions.onFileChange(createMockFileChangeEvent(mockFile), {
        onSuccess,
      });
    });

    expect(onSuccess).toHaveBeenCalledTimes(1);
  });

  test("onFileChange calls onSuccess when file changes", () => {
    const { result } = renderHook(() => useFilePicker());
    const firstFile = createMockFile("first.csv");
    const secondFile = createMockFile("second.csv");
    const onSuccess = jest.fn();

    act(() => {
      result.current.actions.onFileChange(
        createMockFileChangeEvent(firstFile),
        { onSuccess }
      );
    });

    expect(onSuccess).toHaveBeenCalledTimes(1);

    act(() => {
      result.current.actions.onFileChange(
        createMockFileChangeEvent(secondFile),
        { onSuccess }
      );
    });

    expect(onSuccess).toHaveBeenCalledTimes(2);
  });

  test("onFileChange does not call onSuccess when same file is re-selected", () => {
    const { result } = renderHook(() => useFilePicker());
    const mockFile = createMockFile("test.csv");
    const onSuccess = jest.fn();

    act(() => {
      result.current.actions.onFileChange(createMockFileChangeEvent(mockFile), {
        onSuccess,
      });
    });

    expect(onSuccess).toHaveBeenCalledTimes(1);

    // Re-select the same file (same name, size, lastModified)
    act(() => {
      result.current.actions.onFileChange(createMockFileChangeEvent(mockFile), {
        onSuccess,
      });
    });

    // onSuccess should NOT be called again
    expect(onSuccess).toHaveBeenCalledTimes(1);
  });

  test("onFileChange calls onSuccess after onClear and re-select", () => {
    const { result } = renderHook(() => useFilePicker());
    const mockFile = createMockFile("test.csv");
    const onSuccess = jest.fn();

    // Select file
    act(() => {
      result.current.actions.onFileChange(createMockFileChangeEvent(mockFile), {
        onSuccess,
      });
    });

    expect(onSuccess).toHaveBeenCalledTimes(1);

    // Clear file
    act(() => {
      result.current.actions.onClear();
    });

    // Re-select the same file - should call onSuccess since we cleared
    act(() => {
      result.current.actions.onFileChange(createMockFileChangeEvent(mockFile), {
        onSuccess,
      });
    });

    expect(onSuccess).toHaveBeenCalledTimes(2);
  });
});
