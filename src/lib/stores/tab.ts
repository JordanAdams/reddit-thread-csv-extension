import { derived, Readable, readable } from "svelte/store";

const getCurrentActiveTab = async (): Promise<Browser.tabs.Tab | null> => {
  const tabs = await browser.tabs.query({
    active: true,
    currentWindow: true,
  });

  return tabs[0] || null;
};

interface CurrentTabState {
  tab: Browser.tabs.Tab | null;
  lastUpdated: Date;
}

const defaultCurrentTabState = (): CurrentTabState => ({
  tab: null,
  lastUpdated: new Date(),
});

const currentTab = readable<CurrentTabState>(
  defaultCurrentTabState(),
  (_, update) => {
    const onTabUpdated = async () => {
      const occuredAt = new Date();

      getCurrentActiveTab()
        .then((tab) => {
          console.log("current active tab", tab);
          update((current): CurrentTabState => {
            if (occuredAt < current.lastUpdated) {
              return current;
            }

            return { tab, lastUpdated: occuredAt };
          });
        })
        .catch((err) =>
          console.error("Failed to get current active tab:", err),
        );
    };

    onTabUpdated().then(() => {
      browser.tabs.onUpdated.addListener(onTabUpdated);
    });

    return () => {
      browser.tabs.onUpdated.removeListener(onTabUpdated);
    };
  },
);

export const currentTabTitle = derived<
  Readable<CurrentTabState>,
  string | null
>(
  currentTab,
  ($current): string | null => {
    if (!$current.tab || !$current.tab.title) {
      return null;
    }

    return $current.tab.title;
  },
  null,
);

export const currentTabUrl = derived<Readable<CurrentTabState>, URL | null>(
  currentTab,
  ($current): URL | null => {
    if (!$current.tab || !$current.tab.url) {
      return null;
    }

    return URL.parse($current.tab.url);
  },
  null,
);
