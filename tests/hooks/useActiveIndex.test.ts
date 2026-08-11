import { useActiveIndex } from "@repo/shared/views/HomeView/components/Section/components/SectionSubHero/hooks/UseActiveIndex/hook";
import { act, renderHook } from "@testing-library/react";

describe("useActiveIndex", () => {
  it("initializes to the given index", () => {
    const { result } = renderHook(() => useActiveIndex("0"));

    expect(result.current.activeIndex).toBe("0");
  });

  it("selects the given index", () => {
    const { result } = renderHook(() => useActiveIndex("0"));

    act(() => {
      result.current.onSelectIndex("2");
    });
    expect(result.current.activeIndex).toBe("2");
  });
});
