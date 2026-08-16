export const downloadFile = async (
  filename: string,
  contents: string,
): Promise<string> => {
  const blob = new Blob([contents], { type: "text/csv" });
  const url = URL.createObjectURL(blob);

  const downloadId = await browser.downloads.download({
    url,
    filename,
    saveAs: true,
  });

  let downloadedFilename: string = "";

  return new Promise<string>((resolve, reject) => {
    const onChanged = (delta: Browser.downloads.DownloadDelta) => {
      if (delta.id !== downloadId) {
        return;
      }

      if (delta.filename?.current) {
        downloadedFilename = delta.filename.current;
      }

      if (delta.state?.current === "complete") {
        browser.downloads.onChanged.removeListener(onChanged);
        return resolve(downloadedFilename);
      }

      if (delta.state?.current === "interrupted") {
        browser.downloads.onChanged.removeListener(onChanged);
        return reject(
          new Error(delta.error?.current ?? "Download interrupted"),
        );
      }
    };

    browser.downloads.onChanged.addListener(onChanged);
  });
};
