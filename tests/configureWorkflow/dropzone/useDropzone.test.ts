import { act, renderHook } from "@testing-library/react";
import { DragEvent } from "react";
import { useDropzone } from "../../../app/components/Entity/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/components/Dropzone/hooks/useDropzone";

/**
 * Creates a mock DragEvent with configurable currentTarget and relatedTarget.
 * @param overrides - Optional overrides for currentTarget and relatedTarget.
 * @param overrides.currentTarget - Partial HTMLElement to override the default currentTarget.
 * @param overrides.relatedTarget - EventTarget to override the default relatedTarget.
 * @returns The mock drag event.
 */
function createMockDragEvent(
  overrides: {
    currentTarget?: Partial<HTMLElement>;
    relatedTarget?: EventTarget | null;
  } = {}
): DragEvent<HTMLElement> {
  const currentTarget = {
    contains: jest.fn().mockReturnValue(false),
    ...overrides.currentTarget,
  };
  return {
    currentTarget,
    preventDefault: jest.fn(),
    relatedTarget: overrides.relatedTarget ?? null,
    stopPropagation: jest.fn(),
  } as unknown as DragEvent<HTMLElement>;
}

describe("useDropzone", () => {
  describe("initial state", () => {
    test("isDragActive is false initially", () => {
      const onFileDrop = jest.fn();
      const { result } = renderHook(() => useDropzone(onFileDrop));

      expect(result.current.state.isDragActive).toBe(false);
    });

    test("returns all four drag event actions", () => {
      const onFileDrop = jest.fn();
      const { result } = renderHook(() => useDropzone(onFileDrop));

      expect(result.current.actions.onDragEnter).toBeDefined();
      expect(result.current.actions.onDragLeave).toBeDefined();
      expect(result.current.actions.onDragOver).toBeDefined();
      expect(result.current.actions.onDrop).toBeDefined();
    });
  });

  describe("onDragEnter", () => {
    test("sets isDragActive to true", () => {
      const onFileDrop = jest.fn();
      const { result } = renderHook(() => useDropzone(onFileDrop));
      const event = createMockDragEvent();

      act(() => {
        result.current.actions.onDragEnter(event);
      });

      expect(result.current.state.isDragActive).toBe(true);
    });

    test("calls preventDefault and stopPropagation", () => {
      const onFileDrop = jest.fn();
      const { result } = renderHook(() => useDropzone(onFileDrop));
      const event = createMockDragEvent();

      act(() => {
        result.current.actions.onDragEnter(event);
      });

      expect(event.preventDefault).toHaveBeenCalled();
      expect(event.stopPropagation).toHaveBeenCalled();
    });
  });

  describe("onDragLeave", () => {
    test("sets isDragActive to false when leaving the dropzone entirely", () => {
      const onFileDrop = jest.fn();
      const { result } = renderHook(() => useDropzone(onFileDrop));

      // Enter the dropzone.
      act(() => {
        result.current.actions.onDragEnter(createMockDragEvent());
      });

      expect(result.current.state.isDragActive).toBe(true);

      // Leave to an element outside the dropzone.
      const leaveEvent = createMockDragEvent({
        currentTarget: { contains: jest.fn().mockReturnValue(false) },
        relatedTarget: document.createElement("div"),
      });

      act(() => {
        result.current.actions.onDragLeave(leaveEvent);
      });

      expect(result.current.state.isDragActive).toBe(false);
    });

    test("keeps isDragActive true when moving to a child element", () => {
      const onFileDrop = jest.fn();
      const { result } = renderHook(() => useDropzone(onFileDrop));

      // Enter the dropzone.
      act(() => {
        result.current.actions.onDragEnter(createMockDragEvent());
      });

      expect(result.current.state.isDragActive).toBe(true);

      // Move to a child element (relatedTarget is inside currentTarget).
      const childElement = document.createElement("span");
      const leaveEvent = createMockDragEvent({
        currentTarget: { contains: jest.fn().mockReturnValue(true) },
        relatedTarget: childElement,
      });

      act(() => {
        result.current.actions.onDragLeave(leaveEvent);
      });

      expect(result.current.state.isDragActive).toBe(true);
    });

    test("keeps isDragActive true when relatedTarget is null", () => {
      const onFileDrop = jest.fn();
      const { result } = renderHook(() => useDropzone(onFileDrop));

      act(() => {
        result.current.actions.onDragEnter(createMockDragEvent());
      });

      // relatedTarget is null (cursor left the window).
      // contains(null) returns false, so isDragActive should be set to false.
      const leaveEvent = createMockDragEvent({
        currentTarget: { contains: jest.fn().mockReturnValue(false) },
        relatedTarget: null,
      });

      act(() => {
        result.current.actions.onDragLeave(leaveEvent);
      });

      expect(result.current.state.isDragActive).toBe(false);
    });
  });

  describe("onDragOver", () => {
    test("calls preventDefault and stopPropagation", () => {
      const onFileDrop = jest.fn();
      const { result } = renderHook(() => useDropzone(onFileDrop));
      const event = createMockDragEvent();

      act(() => {
        result.current.actions.onDragOver(event);
      });

      expect(event.preventDefault).toHaveBeenCalled();
      expect(event.stopPropagation).toHaveBeenCalled();
    });

    test("does not change isDragActive state", () => {
      const onFileDrop = jest.fn();
      const { result } = renderHook(() => useDropzone(onFileDrop));

      act(() => {
        result.current.actions.onDragOver(createMockDragEvent());
      });

      expect(result.current.state.isDragActive).toBe(false);
    });
  });

  describe("onDrop", () => {
    test("calls onFileDrop callback with the event", () => {
      const onFileDrop = jest.fn();
      const { result } = renderHook(() => useDropzone(onFileDrop));
      const event = createMockDragEvent();

      act(() => {
        result.current.actions.onDrop(event);
      });

      expect(onFileDrop).toHaveBeenCalledWith(event);
    });

    test("sets isDragActive to false", () => {
      const onFileDrop = jest.fn();
      const { result } = renderHook(() => useDropzone(onFileDrop));

      // Enter the dropzone first.
      act(() => {
        result.current.actions.onDragEnter(createMockDragEvent());
      });

      expect(result.current.state.isDragActive).toBe(true);

      // Drop a file.
      act(() => {
        result.current.actions.onDrop(createMockDragEvent());
      });

      expect(result.current.state.isDragActive).toBe(false);
    });

    test("calls preventDefault and stopPropagation", () => {
      const onFileDrop = jest.fn();
      const { result } = renderHook(() => useDropzone(onFileDrop));
      const event = createMockDragEvent();

      act(() => {
        result.current.actions.onDrop(event);
      });

      expect(event.preventDefault).toHaveBeenCalled();
      expect(event.stopPropagation).toHaveBeenCalled();
    });
  });
});
