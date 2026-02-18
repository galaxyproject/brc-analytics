import {
  calculateTruncation,
  renderText,
} from "../../../../app/components/common/TruncatedText/utils";

// Mock canvas context for text measurement.
const mockMeasureText = jest.fn();
const mockCanvasContext = {
  font: "",
  measureText: mockMeasureText,
} as unknown as CanvasRenderingContext2D;

// Mock document.createElement to return our mock canvas.
const originalCreateElement = document.createElement.bind(document);
jest.spyOn(document, "createElement").mockImplementation((tagName: string) => {
  if (tagName === "canvas") {
    return {
      getContext: () => mockCanvasContext,
    } as unknown as HTMLCanvasElement;
  }
  return originalCreateElement(tagName);
});

// Mock getComputedStyle.
const mockGetComputedStyle = jest.spyOn(window, "getComputedStyle");

describe("TruncatedText utils", () => {
  describe("renderText", () => {
    const fullText = "This is the full text content.";
    const truncatedText = "This is the";

    test("returns full text when expanded", () => {
      expect(renderText(fullText, truncatedText, true)).toBe(fullText);
    });

    test("returns full text when truncatedText is null (no truncation needed)", () => {
      expect(renderText(fullText, null, false)).toBe(fullText);
    });

    test("returns truncated text with ellipsis when collapsed and truncation needed", () => {
      expect(renderText(fullText, truncatedText, false)).toBe(
        `${truncatedText}...`
      );
    });

    test("returns full text when expanded even if truncatedText exists", () => {
      expect(renderText(fullText, truncatedText, true)).toBe(fullText);
    });

    test("handles empty string", () => {
      expect(renderText("", null, false)).toBe("");
    });

    test("handles empty truncated text", () => {
      expect(renderText(fullText, "", false)).toBe("...");
    });
  });

  describe("calculateTruncation", () => {
    const mockContainer = document.createElement("div");

    beforeEach(() => {
      jest.clearAllMocks();
      mockGetComputedStyle.mockReturnValue({
        fontFamily: "Arial",
        fontSize: "16px",
        fontWeight: "400",
      } as CSSStyleDeclaration);
    });

    test("returns null for empty text", () => {
      expect(calculateTruncation("", mockContainer, 300, 2)).toBeNull();
    });

    test("returns null for maxLines less than 1", () => {
      expect(
        calculateTruncation("Some text", mockContainer, 300, 0)
      ).toBeNull();
    });

    test("returns null when text fits within maxLines", () => {
      // Mock measureText to return widths that fit on one line.
      mockMeasureText.mockImplementation((text: string) => ({
        width: text.length * 8, // 8px per character
      }));

      const shortText = "Short text";
      // Container width of 300px can fit ~37 characters.
      expect(calculateTruncation(shortText, mockContainer, 300, 2)).toBeNull();
    });

    test("returns truncated text when text exceeds maxLines", () => {
      // Mock measureText with consistent character widths.
      mockMeasureText.mockImplementation((text: string) => ({
        width: text.length * 10, // 10px per character
      }));

      const longText =
        "This is a very long text that should definitely need to be truncated because it exceeds the maximum width";
      // Container width of 200px can fit ~20 characters per line.
      const result = calculateTruncation(longText, mockContainer, 200, 2);

      expect(result).not.toBeNull();
      expect(result!.length).toBeLessThan(longText.length);
    });

    test("sets canvas font from computed style", () => {
      mockMeasureText.mockImplementation(() => ({ width: 50 }));

      calculateTruncation("Test", mockContainer, 300, 2);

      expect(mockCanvasContext.font).toBe("400 16px Arial");
    });
  });
});
