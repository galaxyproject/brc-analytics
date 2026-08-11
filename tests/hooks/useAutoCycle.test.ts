import { useAutoCycle } from "@repo/shared/views/HomeView/components/Section/components/SectionSubHero/hooks/UseAutoCycle/hook";
import { act, renderHook } from "@testing-library/react";

const KEYS = ["0", "1", "2"];
const EMPTY: string[] = [];

describe("useAutoCycle", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it("does not start cycling for an empty key list", () => {
    const { result } = renderHook(() => useAutoCycle(EMPTY));

    expect(result.current.activeIndex).toBe("");
    // No interval is scheduled at all for an empty list (this would still be 1
    // if the early-return were removed, even though activeIndex wouldn't change).
    expect(jest.getTimerCount()).toBe(0);
    act(() => {
      jest.advanceTimersByTime(15000);
    });
    expect(result.current.activeIndex).toBe("");
  });

  it("cycles through the keys on each interval, wrapping around", () => {
    const { result } = renderHook(() => useAutoCycle(KEYS));

    expect(result.current.activeIndex).toBe("0");
    // An interval is scheduled when there are keys to cycle through.
    expect(jest.getTimerCount()).toBe(1);
    act(() => {
      jest.advanceTimersByTime(5000);
    });
    expect(result.current.activeIndex).toBe("1");
    act(() => {
      jest.advanceTimersByTime(5000);
    });
    expect(result.current.activeIndex).toBe("2");
    act(() => {
      jest.advanceTimersByTime(5000);
    });
    expect(result.current.activeIndex).toBe("0");
  });

  it("restarts the cycle from a selected key", () => {
    const { result } = renderHook(() => useAutoCycle(KEYS));

    act(() => {
      result.current.onSelectIndex("2");
    });
    expect(result.current.activeIndex).toBe("2");
    act(() => {
      jest.advanceTimersByTime(5000);
    });
    expect(result.current.activeIndex).toBe("0");
  });
});
