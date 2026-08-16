const getCurrentTabUrl = async (): Promise<string> => {
  const tabs = await browser.tabs.query({
    active: true,
    currentWindow: true,
  });

  if (!tabs?.[0]?.url) {
    return "";
  }

  return tabs[0].url;
};
