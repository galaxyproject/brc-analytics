import {
  type BionymTab,
  type BionymTabState,
} from "@brc/views/GeneDetailView/components/BionymSection/types";
import {
  getActiveTab,
  rethrowUnlessCancelled,
} from "@brc/views/GeneDetailView/components/BionymSection/utils";
import { useHash } from "@databiosphere/findable-ui/lib/components/Layout/components/Outline/hooks/UseHash/hook";
import { useRouter } from "next/router";
import { useRef, useState } from "react";

/**
 * The tab the section shows, and a function to choose another.
 * The tab follows the URL hash, as on the back button. Next changes the hash
 * only once it has rendered the navigation, so a chosen tab shows at once,
 * until the last navigation asked for is done; the tabs ignore a click on the
 * tab they show as selected, so a quick second click would otherwise be lost.
 * @returns The tab shown, and a function that navigates to a tab.
 */
export function useBionymTab(): BionymTabState {
  const { push } = useRouter();
  const hashTab = getActiveTab(useHash().hash);
  const [chosenTab, setChosenTab] = useState<BionymTab | null>(null);
  const lastNavigation = useRef(0);

  const selectTab = (tab: BionymTab): void => {
    const navigation = ++lastNavigation.current;
    setChosenTab(tab);
    // Next's router, not the History API, so Next records the history entry
    // and renders the gene page again when the back button returns to it.
    push(`#${tab}`, undefined, { scroll: false }).then(() => {
      if (navigation === lastNavigation.current) setChosenTab(null);
    }, rethrowUnlessCancelled);
  };

  return { selectTab, tab: chosenTab ?? hashTab };
}
